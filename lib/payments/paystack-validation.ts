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
    sizing: z
      .object({
        version: paystackNumericValue.pipe(z.literal(1)),
        mode: z.enum(["trouser", "shorts", "skirt"]),
        fitProfile: z.enum(["men", "women", "unisex"]),
        unit: z.enum(["in", "cm"]),
        waist: paystackNumericValue.pipe(z.number().finite().positive()),
        hip: paystackNumericValue.pipe(z.number().finite().positive()),
        length: paystackNumericValue.pipe(z.number().finite().positive()),
        lengthType: z.enum(["insideLeg", "shortInseam", "skirtLength"]),
      })
      .passthrough()
      .optional(),
    alphaSize: z.enum(["S", "M", "L", "XL", "2XL", "3XL", "4XL"]).optional(),
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
      .union([
        z.literal(1),
        z.literal("1"),
        z.literal(2),
        z.literal("2"),
        z.literal(3),
        z.literal("3"),
      ])
      .transform((version) => Number(version) as 1 | 2 | 3),
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
  .passthrough();
