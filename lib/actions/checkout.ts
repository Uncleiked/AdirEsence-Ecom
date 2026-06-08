"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { client } from "@/sanity/lib/client";
import { PRODUCTS_BY_IDS_QUERY } from "@/lib/sanity/queries/products";
import { getOrCreateStripeCustomer } from "@/lib/actions/customer";
import { createPaystackCheckoutSession } from "@/lib/actions/paystack";
import {
  getPaymentProvider,
  calculateShippingFee,
  calculateServiceCharge,
} from "@/lib/constants/payment";
import { ORDER_DETAILS_BY_PAYMENT_ID_QUERY } from "@/lib/sanity/queries/orders";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});

// Types
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Address {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
  state?: string;
}

interface CheckoutResult {
  success: boolean;
  url?: string;
  error?: string;
}

const SHIPPING_RATES_QUERY = `*[_type == "siteSettings"] | order(_updatedAt desc)[0] {
  shippingLagos,
  shippingRestOfNigeria,
  shippingAfrica,
  shippingInternational
}`;

/**
 * Creates a Checkout Session (Stripe or Paystack) from cart items and address.
 * Validates stock, prices, shipping rates, and service fees on the server to prevent tampering.
 */
export async function createCheckoutSession(
  items: CartItem[],
  address: Address
): Promise<CheckoutResult> {
  try {
    // 1. Verify user is authenticated
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return { success: false, error: "Please sign in to checkout" };
    }

    // 2. Validate cart items and address details
    if (!items || items.length === 0) {
      return { success: false, error: "Your cart is empty" };
    }

    if (!address.name || !address.line1 || !address.city || !address.country) {
      return { success: false, error: "Please enter your full delivery address details" };
    }

    // 3. Fetch product details from Sanity to validate prices/stock
    const productIds = items.map((item) => item.productId);
    const products = await client.fetch(PRODUCTS_BY_IDS_QUERY, {
      ids: productIds,
    });

    // 4. Validate stock and calculate net subtotal
    const validationErrors: string[] = [];
    const validatedItems: {
      product: (typeof products)[number];
      quantity: number;
    }[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = products.find(
        (p: { _id: string }) => p._id === item.productId
      );

      if (!product) {
        validationErrors.push(`Product "${item.name}" is no longer available`);
        continue;
      }

      if ((product.stock ?? 0) === 0) {
        validationErrors.push(`"${product.name}" is out of stock`);
        continue;
      }

      if (item.quantity > (product.stock ?? 0)) {
        validationErrors.push(
          `Only ${product.stock} of "${product.name}" available`
        );
        continue;
      }

      validatedItems.push({ product, quantity: item.quantity });
      subtotal += (product.price ?? 0) * item.quantity;
    }

    if (validationErrors.length > 0) {
      return { success: false, error: validationErrors.join(". ") };
    }

    // 5. Fetch shipping rates from Sanity to calculate shipping fee securely
    const rates = await client.fetch(SHIPPING_RATES_QUERY);
    const shippingFee = calculateShippingFee(
      address.country,
      address.city,
      rates || {
        shippingLagos: 5000,
        shippingRestOfNigeria: 10000,
        shippingAfrica: 20000,
        shippingInternational: 50000,
      }
    );

    // 6. Determine routing based on country code
    const provider = getPaymentProvider(address.country);

    // 7. Calculate service charge (transaction fee)
    // Assume local NG card if using Paystack (most common, or standard rate)
    const serviceCharge = calculateServiceCharge(
      subtotal + shippingFee,
      provider,
      true
    );

    // 8. Execute Paystack flow if provider is Paystack
    if (provider === "paystack") {
      return await createPaystackCheckoutSession(
        items,
        address,
        shippingFee,
        serviceCharge
      );
    }

    // 9. Execute Stripe flow if provider is Stripe
    // Prepare line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      validatedItems.map(({ product, quantity }) => ({
        price_data: {
          currency: "ngn",
          product_data: {
            name: product.name ?? "Product",
            images: product.image?.asset?.url ? [product.image.asset.url] : [],
            metadata: {
              productId: product._id,
            },
          },
          unit_amount: Math.round((product.price ?? 0) * 100), // Convert to kobo/cents
        },
        quantity,
      }));

    // Add shipping fee as a separate line item
    if (shippingFee > 0) {
      lineItems.push({
        price_data: {
          currency: "ngn",
          product_data: {
            name: "Shipping & Delivery",
            description: `Delivery charge for ${address.city}, ${address.country}`,
          },
          unit_amount: Math.round(shippingFee * 100),
        },
        quantity: 1,
      });
    }

    // Add service charge as a separate line item
    if (serviceCharge > 0) {
      lineItems.push({
        price_data: {
          currency: "ngn",
          product_data: {
            name: "Service Charge",
            description: "Processor gateway fee",
          },
          unit_amount: Math.round(serviceCharge * 100),
        },
        quantity: 1,
      });
    }

    // Get or create Stripe customer
    const userEmail = user.emailAddresses[0]?.emailAddress ?? "";
    const userName = address.name;

    const { stripeCustomerId, sanityCustomerId } =
      await getOrCreateStripeCustomer(userEmail, userName, userId);

    // Prepare metadata
    const metadata = {
      clerkUserId: userId,
      userEmail,
      sanityCustomerId,
      productIds: validatedItems.map((i) => i.product._id).join(","),
      quantities: validatedItems.map((i) => i.quantity).join(","),
      shippingFee: shippingFee.toString(),
      serviceCharge: serviceCharge.toString(),
      shippingName: address.name,
      shippingLine1: address.line1,
      shippingLine2: address.line2 || "",
      shippingCity: address.city,
      shippingPostcode: address.postcode,
      shippingCountry: address.country,
    };

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer: stripeCustomerId,
      metadata,
      success_url: `${baseUrl}/shop/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/shop/checkout`,
    });

    return { success: true, url: session.url ?? undefined };
  } catch (error) {
    console.error("Stripe/Unified Checkout session error:", error);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}

/**
 * Retrieves a checkout session by ID (works for both Stripe sessions and Paystack references in Sanity)
 */
export async function getCheckoutSession(sessionId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if this is a Stripe Session ID (typically starts with cs_)
    if (sessionId.startsWith("cs_")) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ["line_items", "customer_details"],
        });

        // Verify the session belongs to this user
        if (session.metadata?.clerkUserId !== userId) {
          return { success: false, error: "Session not found" };
        }

        return {
          success: true,
          session: {
            id: session.id,
            customerEmail: session.customer_details?.email,
            customerName: session.customer_details?.name,
            amountTotal: session.amount_total,
            paymentStatus: session.payment_status,
            shippingAddress: {
              name: session.customer_details?.name ?? "",
              line1: session.customer_details?.address?.line1 ?? "",
              line2: session.customer_details?.address?.line2 ?? "",
              city: session.customer_details?.address?.city ?? "",
              postcode: session.customer_details?.address?.postal_code ?? "",
              country: session.customer_details?.address?.country ?? "",
            },
            lineItems: session.line_items?.data.map((item) => ({
              name: item.description,
              quantity: item.quantity,
              amount: item.amount_total,
            })),
          },
        };
      } catch (stripeError) {
        console.warn("Failed to retrieve from Stripe, falling back to Sanity search:", stripeError);
      }
    }

    // Fallback: Search in Sanity (for Paystack references or completed Stripe sessions)
    const order = await client.fetch(ORDER_DETAILS_BY_PAYMENT_ID_QUERY, {
      paymentId: sessionId,
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Verify the order belongs to this user
    if (order.clerkUserId !== userId) {
      return { success: false, error: "Unauthorized access to order details" };
    }

    return {
      success: true,
      session: {
        id: order._id,
        customerEmail: order.email,
        customerName: order.address?.name || "",
        amountTotal: Math.round(order.total * 100), // convert NGN to kobo
        paymentStatus: order.status === "paid" ? "paid" : "unpaid",
        shippingAddress: {
          name: order.address?.name || "",
          line1: order.address?.line1 || "",
          line2: order.address?.line2 || "",
          city: order.address?.city || "",
          postcode: order.address?.postcode || "",
          country: order.address?.country || "",
        },
        lineItems: order.items?.map((item: any) => ({
          name: item.product?.name || "Product",
          quantity: item.quantity,
          amount: Math.round((item.priceAtPurchase * item.quantity) * 100),
        })),
      },
    };
  } catch (error) {
    console.error("Get session error:", error);
    return { success: false, error: "Could not retrieve order details" };
  }
}
