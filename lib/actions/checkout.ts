"use server";

import { createHash } from "node:crypto";
import { auth, currentUser } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { client, writeClient } from "@/sanity/lib/client";
import { PRODUCTS_BY_IDS_QUERY } from "@/lib/sanity/queries/products";
import { CUSTOMER_BY_EMAIL_QUERY } from "@/lib/sanity/queries/customers";
import { calculateShippingFee } from "@/lib/constants/payment";
import { resolveCheckoutBaseUrl } from "@/lib/payments/app-url";
import {
  initializePaystackTransaction,
  verifyPaystackTransaction,
} from "@/lib/payments/paystack";
import {
  fulfillPaidOrder,
  paystackSuccessfulTransactionSchema,
} from "@/lib/payments/paystack-order";
import { getPaystackOrderIdentity } from "@/lib/payments/paystack-reference";
import {
  resolveGarmentSizingMode,
  validateProductSizing,
} from "@/lib/sizing/garment-sizing";
import {
  checkoutRequestSchema,
  type CheckoutAddress,
  type CheckoutItem,
  type PaystackCheckoutMetadata,
} from "@/lib/validation/checkout";

interface CheckoutResult {
  success: boolean;
  url?: string;
  error?: string;
}

interface CheckoutProduct {
  _id: string;
  name?: string | null;
  price?: number | null;
  stock?: number | null;
  category?: {
    slug?: string | null;
    sizingMode?: string | null;
  } | null;
}

interface StoredOrder {
  orderNumber?: string | null;
  clerkUserId?: string | null;
  email?: string | null;
  items?: Array<{
    quantity?: number | null;
    priceAtPurchase?: number | null;
    product?: { _ref?: string | null } | null;
  }> | null;
  total?: number | null;
  status?: string | null;
  paymentId?: string | null;
  address?: {
    name?: string | null;
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postcode?: string | null;
    country?: string | null;
  } | null;
}

interface StoredProduct {
  name?: string | null;
}

const SHIPPING_RATES_QUERY = `*[_type == "siteSettings"] | order(_updatedAt desc)[0] {
  shippingLagos,
  shippingRestOfNigeria,
  shippingAfrica,
  shippingInternational
}`;

const DEFAULT_SHIPPING_RATES = {
  shippingLagos: 50,
  shippingRestOfNigeria: 10_000,
  shippingAfrica: 20_000,
  shippingInternational: 50_000,
};

async function getBaseUrl(): Promise<string> {
  const requestHeaders = await headers();

  return resolveCheckoutBaseUrl({
    configuredUrl: process.env.NEXT_PUBLIC_BASE_URL,
    requestOrigin: requestHeaders.get("origin"),
    forwardedHost:
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
    forwardedProto: requestHeaders.get("x-forwarded-proto"),
    vercelUrl: process.env.VERCEL_URL,
  });
}

async function getOrCreateCustomer(
  email: string,
  name: string,
  clerkUserId: string,
): Promise<string> {
  const existingCustomer = await client.fetch(CUSTOMER_BY_EMAIL_QUERY, {
    email,
  });

  if (existingCustomer?._id) {
    await writeClient
      .patch(existingCustomer._id)
      .set({ clerkUserId, name })
      .commit();
    return existingCustomer._id;
  }

  const idHash = createHash("sha256").update(clerkUserId).digest("hex");
  const customerId = `customer.clerk.${idHash}`;

  await writeClient.createIfNotExists({
    _id: customerId,
    _type: "customer",
    email,
    name,
    clerkUserId,
    createdAt: new Date().toISOString(),
  });

  return customerId;
}

/**
 * Starts the only supported checkout flow: an authenticated Paystack payment.
 * Client prices are ignored; prices, stock, shipping, and totals are rebuilt here.
 */
export async function createCheckoutSession(
  items: CheckoutItem[],
  address: CheckoutAddress,
): Promise<CheckoutResult> {
  try {
    const [{ userId }, user] = await Promise.all([auth(), currentUser()]);

    if (!userId || !user) {
      return { success: false, error: "Please sign in to checkout" };
    }

    const request = checkoutRequestSchema.safeParse({ items, address });

    if (!request.success) {
      const issue = request.error.issues[0];
      console.warn("Rejected invalid checkout request", {
        code: issue?.code,
        path: issue?.path.join("."),
      });
      return {
        success: false,
        error:
          issue?.code === "unrecognized_keys"
            ? "Your saved cart data is outdated. Please refresh the page and try again."
            : (issue?.message ?? "Invalid checkout details"),
      };
    }

    const { items: parsedItems, address: parsedAddress } = request.data;
    const productIds = parsedItems.map((item) => item.productId);
    const products = await client.fetch<CheckoutProduct[]>(
      PRODUCTS_BY_IDS_QUERY,
      { ids: productIds },
    );
    const productById = new Map(
      products.map((product) => [product._id, product]),
    );

    const validationErrors: string[] = [];
    const orderItems: PaystackCheckoutMetadata["items"] = [];
    const requestedByProduct = new Map<string, number>();
    let subtotal = 0;

    for (const item of parsedItems) {
      const product = productById.get(item.productId);
      const unitPrice = product?.price;

      if (!product) {
        validationErrors.push(`Product "${item.name}" is no longer available`);
        continue;
      }

      if (
        typeof unitPrice !== "number" ||
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
      ) {
        validationErrors.push(
          `"${product.name ?? item.name}" does not have a valid price`,
        );
        continue;
      }

      const sizingMode = resolveGarmentSizingMode(product.category);
      const sizingErrors = validateProductSizing(
        item.sizing,
        item.alphaSize,
        sizingMode,
      );
      if (sizingErrors.length > 0) {
        validationErrors.push(
          `"${product.name ?? item.name}": ${sizingErrors.join(", ")}`,
        );
        continue;
      }

      orderItems.push({
        productId: product._id,
        name: product.name ?? item.name,
        quantity: item.quantity,
        unitPrice,
        ...(item.sizing ? { sizing: item.sizing } : {}),
        ...(item.alphaSize ? { alphaSize: item.alphaSize } : {}),
      });
      requestedByProduct.set(
        product._id,
        (requestedByProduct.get(product._id) ?? 0) + item.quantity,
      );
      subtotal += unitPrice * item.quantity;
    }

    for (const [productId, requestedQuantity] of requestedByProduct) {
      const product = productById.get(productId);
      const stock = product?.stock;

      if (
        typeof stock !== "number" ||
        !Number.isInteger(stock) ||
        stock < requestedQuantity
      ) {
        validationErrors.push(
          stock && stock > 0
            ? `Only ${stock} of "${product?.name ?? "this product"}" available`
            : `"${product?.name ?? "This product"}" is out of stock`,
        );
      }
    }

    if (validationErrors.length > 0) {
      return { success: false, error: validationErrors.join(". ") };
    }

    const rates = await client.fetch(SHIPPING_RATES_QUERY);
    const shippingFee = calculateShippingFee(
      parsedAddress.country,
      parsedAddress.state,
      rates || DEFAULT_SHIPPING_RATES,
    );

    // Paystack fees depend on the payment instrument, which is not known until
    // hosted checkout. The store absorbs the processor fee instead of guessing.
    const serviceCharge = 0;
    const amountKobo = Math.round((subtotal + shippingFee) * 100);

    if (!Number.isSafeInteger(amountKobo) || amountKobo <= 0) {
      return { success: false, error: "The checkout total is invalid" };
    }

    const userEmail =
      user.emailAddresses.find(
        (entry) => entry.id === user.primaryEmailAddressId,
      )?.emailAddress ?? user.emailAddresses[0]?.emailAddress;

    if (!userEmail) {
      return {
        success: false,
        error: "Your account needs a verified email before checkout",
      };
    }

    const sanityCustomerId = await getOrCreateCustomer(
      userEmail,
      parsedAddress.name,
      userId,
    );
    const metadata: PaystackCheckoutMetadata = {
      version: 3,
      clerkUserId: userId,
      userEmail,
      sanityCustomerId,
      items: orderItems,
      shippingFee,
      serviceCharge,
      expectedAmountKobo: amountKobo,
      address: parsedAddress,
    };

    const transaction = await initializePaystackTransaction({
      email: userEmail,
      amountKobo,
      metadata,
      baseUrl: await getBaseUrl(),
    });

    return { success: true, url: transaction.authorizationUrl };
  } catch (error) {
    console.error("Paystack checkout session error", error);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}
/** Retrieves a completed Paystack checkout from the local order record. */
export async function getCheckoutSession(sessionId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    if (
      typeof sessionId !== "string" ||
      sessionId.length > 200 ||
      !/^[A-Za-z0-9.=-]+$/.test(sessionId)
    ) {
      return { success: false, error: "Order not found" };
    }

    const { orderId } = getPaystackOrderIdentity(sessionId);
    let order = await writeClient.getDocument<StoredOrder>(orderId);

    // The webhook and browser callback can arrive in either order. If the
    // order is not present yet, securely re-verify the charge and complete the
    // same idempotent fulfillment path before rendering the confirmation.
    if (!order) {
      const verification = await verifyPaystackTransaction(sessionId);
      const verifiedTransaction = paystackSuccessfulTransactionSchema.safeParse(
        verification,
      );

      if (
        !verifiedTransaction.success ||
        verifiedTransaction.data.metadata.clerkUserId !== userId
      ) {
        return { success: false, error: "Order not found" };
      }

      await fulfillPaidOrder(verifiedTransaction.data);
      order = await writeClient.getDocument<StoredOrder>(orderId);
    }

    if (
      !order ||
      order.paymentId !== sessionId ||
      order.clerkUserId !== userId
    ) {
      return { success: false, error: "Order not found" };
    }

    const productIds = (order.items ?? [])
      .map((item) => item.product?._ref)
      .filter((productId): productId is string => Boolean(productId));
    const products = productIds.length
      ? await writeClient.getDocuments<StoredProduct>(productIds)
      : [];
    const productNames = new Map(
      productIds.map((productId, index) => [
        productId,
        products[index]?.name ?? "Product",
      ]),
    );

    const paidStatuses = new Set([
      "paid",
      "inventory_issue",
      "shipped",
      "delivered",
    ]);

    return {
      success: true,
      session: {
        id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.status,
        customerEmail: order.email,
        customerName: order.address?.name || "",
        amountTotal: Math.round((order.total ?? 0) * 100),
        paymentStatus: paidStatuses.has(order.status ?? "")
          ? "paid"
          : "unpaid",
        shippingAddress: {
          name: order.address?.name || "",
          line1: order.address?.line1 || "",
          line2: order.address?.line2 || "",
          city: order.address?.city || "",
          state: order.address?.state || "",
          postcode: order.address?.postcode || "",
          country: order.address?.country || "",
        },
        lineItems: order.items?.map((item) => ({
          name:
            (item.product?._ref && productNames.get(item.product._ref)) ||
            "Product",
          quantity: item.quantity,
          amount: Math.round(
            (item.priceAtPurchase ?? 0) * (item.quantity ?? 0) * 100,
          ),
        })),
      },
    };
  } catch (error) {
    console.error("Get checkout session error", error);
    return { success: false, error: "Could not retrieve order details" };
  }
}
