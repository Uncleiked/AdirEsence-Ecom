import { z } from "zod";
import { checkoutAddressSchema } from "../validation/checkout.ts";

const paystackNumericValue = z
  .union([
    z.number(),
    z.string().trim().regex(/^\d+(?:\.\d+)?$/),
  ])
  .transform(Number);

const paystackOrderItemSchema = z
  .object({
    productId: z.string().trim().min(1).max(200),
    name: z.string().trim().min(1).max(200),
    quantity: paystackNumericValue.pipe(
      z.number().finite().int().positive().max(100),
    ),
    unitPrice: paystackNumericValue.pipe(z.number().finite().nonnegative()),
  })
  .passthrough();

/**
 * Paystack serializes custom metadata scalar values as strings and may append
 * gateway-owned fields such as `referrer`. Normalize only the fields required
 * for fulfillment, while retaining strict constraints on their values.
 */
export const paystackReturnedMetadataSchema = z
  .object({
    version: z
      .union([z.literal(1), z.literal("1")])
      .transform(() => 1 as const),
    clerkUserId: z.string().trim().min(1).max(200),
    userEmail: z.string().email().max(254),
    sanityCustomerId: z.string().trim().min(1).max(200),
    items: z.array(paystackOrderItemSchema).min(1).max(50),
    shippingFee: paystackNumericValue.pipe(z.number().finite().nonnegative()),
    serviceCharge: paystackNumericValue.pipe(z.number().finite().nonnegative()),
    expectedAmountKobo: paystackNumericValue.pipe(
      z.number().finite().int().positive(),
    ),
    address: checkoutAddressSchema,
    cancel_action: z.string().url().optional(),
  })
  .passthrough()
  .superRefine((metadata, context) => {
    const productIds = new Set<string>();

    for (const [index, item] of metadata.items.entries()) {
      if (productIds.has(item.productId)) {
        context.addIssue({
          code: "custom",
          path: ["items", index, "productId"],
          message: "Duplicate products are not allowed",
        });
      }
      productIds.add(item.productId);
    }
  });

