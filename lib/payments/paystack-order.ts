import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";
import { writeClient } from "@/sanity/lib/client";
import { ORDER_BY_PAYMENT_ID_QUERY } from "@/lib/sanity/queries/orders";
import { paystackReturnedMetadataSchema } from "@/lib/payments/paystack-validation";
import {
  calculateRemainingStock,
  findInventoryShortages,
  type InventoryProduct,
} from "@/lib/payments/order-fulfillment";

export const paystackSuccessfulTransactionSchema = z
  .object({
    reference: z
      .string()
      .min(1)
      .max(200)
      .regex(/^[A-Za-z0-9.=-]+$/),
    amount: z.number().int().positive(),
    currency: z.literal("NGN"),
    status: z.literal("success"),
    customer: z
      .object({
        email: z.string().email().optional(),
        customer_code: z.string().max(200).optional(),
      })
      .passthrough(),
    metadata: paystackReturnedMetadataSchema,
  })
  .passthrough()
  .superRefine((transaction, context) => {
    if (transaction.amount !== transaction.metadata.expectedAmountKobo) {
      context.addIssue({
        code: "custom",
        path: ["amount"],
        message: "Payment amount does not match the initialized checkout",
      });
    }
  });

export type PaystackSuccessfulTransaction = z.infer<
  typeof paystackSuccessfulTransactionSchema
>;

export interface FulfilledOrder {
  orderId: string;
  orderNumber: string;
  status: string;
}

interface ExistingOrder {
  _id: string;
  orderNumber?: string | null;
  status?: string | null;
}

async function findExistingOrder(
  reference: string,
): Promise<ExistingOrder | null> {
  return writeClient.fetch<ExistingOrder | null>(ORDER_BY_PAYMENT_ID_QUERY, {
    paymentId: reference,
  });
}

/**
 * Idempotently creates the paid order and updates every product's stock in the
 * same Sanity transaction. Revision guards force concurrent purchases to retry
 * against the latest inventory value.
 */
export async function fulfillPaidOrder(
  data: PaystackSuccessfulTransaction,
): Promise<FulfilledOrder> {
  const { reference, metadata } = data;
  const referenceHash = createHash("sha256").update(reference).digest("hex");
  const orderId = `order.paystack.${referenceHash}`;
  const orderNumber = `ORD-${referenceHash.slice(0, 12).toUpperCase()}`;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const existingOrder = await findExistingOrder(reference);
    if (existingOrder) {
      return {
        orderId: existingOrder._id,
        orderNumber: existingOrder.orderNumber ?? orderNumber,
        status: existingOrder.status ?? "paid",
      };
    }

    const productIds = metadata.items.map((item) => item.productId);
    const products = await writeClient.fetch<InventoryProduct[]>(
      `*[_type == "product" && _id in $productIds] { _id, _rev, stock }`,
      { productIds },
    );
    const productsById = new Map(
      products.map((product) => [product._id, product]),
    );
    const shortages = findInventoryShortages(metadata.items, products);
    const createdAt = new Date().toISOString();
    const hasInventoryIssue = shortages.length > 0;
    const status = hasInventoryIssue ? "inventory_issue" : "paid";

    const order = {
      _id: orderId,
      _type: "order" as const,
      orderNumber,
      customer: {
        _type: "reference" as const,
        _ref: metadata.sanityCustomerId,
      },
      clerkUserId: metadata.clerkUserId,
      email: metadata.userEmail,
      items: metadata.items.map((item, index) => ({
        _key: `item-${index}-${referenceHash.slice(0, 8)}`,
        product: {
          _type: "reference" as const,
          _ref: item.productId,
        },
        quantity: item.quantity,
        priceAtPurchase: item.unitPrice,
      })),
      total: data.amount / 100,
      status,
      paymentId: reference,
      paymentProvider: "paystack",
      shippingFee: metadata.shippingFee,
      serviceCharge: metadata.serviceCharge,
      address: metadata.address,
      ...(hasInventoryIssue
        ? {
            inventoryIssue: {
              reason:
                "Paid order could not reserve all requested stock. No inventory was decremented.",
              detectedAt: createdAt,
              items: shortages.map((shortage, index) => ({
                _key: `shortage-${index}`,
                ...shortage,
              })),
            },
          }
        : {}),
      createdAt,
    };

    let transaction = writeClient.transaction().create(order);
    if (data.customer.customer_code) {
      transaction = transaction.patch(metadata.sanityCustomerId, (patch) =>
        patch.setIfMissing({
          paystackCustomerCode: data.customer.customer_code,
        }),
      );
    }

    if (!hasInventoryIssue) {
      for (const item of metadata.items) {
        const product = productsById.get(item.productId);
        if (!product || typeof product.stock !== "number") {
          throw new Error(
            `Product disappeared before inventory commit: ${item.productId}`,
          );
        }

        const remainingStock = calculateRemainingStock(
          product.stock,
          item.quantity,
        );
        transaction = transaction.patch(item.productId, (patch) =>
          patch.ifRevisionId(product._rev).set({ stock: remainingStock }),
        );
      }
    }

    try {
      await transaction.commit();
      return { orderId, orderNumber, status };
    } catch (error) {
      // A simultaneous webhook/callback may have completed the deterministic
      // order first. A product revision conflict should retry with fresh stock.
      const completedOrder = await findExistingOrder(reference);
      if (completedOrder) {
        return {
          orderId: completedOrder._id,
          orderNumber: completedOrder.orderNumber ?? orderNumber,
          status: completedOrder.status ?? status,
        };
      }

      if (attempt === 2) throw error;
    }
  }

  throw new Error("Unable to fulfill paid order after retrying inventory");
}
