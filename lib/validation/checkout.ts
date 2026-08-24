import { z } from "zod";
import {
  FIT_PROFILES,
  GARMENT_SIZING_VERSION,
  MEASUREMENT_UNITS,
  ALPHA_SIZES,
  createCartLineId,
} from "../sizing/garment-sizing.ts";

const requiredText = (label: string, maxLength: number) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(maxLength, `${label} is too long`);

export const checkoutItemSchema = z
  .object({
    lineId: requiredText("Cart line ID", 500),
    productId: requiredText("Product ID", 200),
    name: requiredText("Product name", 200),
    price: z.number().finite().nonnegative(),
    quantity: z
      .number({ error: "Quantity must be a number" })
      .finite()
      .int("Quantity must be a whole number")
      .positive("Quantity must be at least 1")
      .max(100, "Quantity cannot exceed 100"),
    image: z.string().max(2_048).optional(),
    // Used only for client-side cart navigation. Checkout still resolves the
    // authoritative product, price, and stock from Sanity by productId.
    slug: z.string().trim().max(200).optional(),
    sizing: z
      .object({
        version: z.literal(GARMENT_SIZING_VERSION),
        mode: z.enum(["trouser", "shorts", "skirt"]),
        fitProfile: z.enum(FIT_PROFILES),
        unit: z.enum(MEASUREMENT_UNITS),
        waist: z.number().finite().positive(),
        hip: z.number().finite().positive(),
        length: z.number().finite().positive(),
        lengthType: z.enum(["insideLeg", "shortInseam", "skirtLength"]),
      })
      .strict()
      .optional(),
    alphaSize: z.enum(ALPHA_SIZES).optional(),
  })
  .strict();

export const checkoutItemsSchema = z
  .array(checkoutItemSchema)
  .min(1, "Your cart is empty")
  .max(50, "Your cart contains too many items")
  .superRefine((items, context) => {
    const lineIds = new Set<string>();

    for (const [index, item] of items.entries()) {
      if (
        item.lineId !==
        createCartLineId(item.productId, item.sizing, item.alphaSize)
      ) {
        context.addIssue({
          code: "custom",
          path: [index, "lineId"],
          message: "Cart line configuration is invalid",
        });
      }

      if (lineIds.has(item.lineId)) {
        context.addIssue({
          code: "custom",
          path: [index, "lineId"],
          message: "Duplicate cart lines are not allowed",
        });
      }
      lineIds.add(item.lineId);
    }
  });

export const checkoutAddressSchema = z
  .object({
    name: requiredText("Full name", 120),
    email: z.string().trim().email("Enter a valid email").max(254),
    phone: requiredText("Phone number", 30).refine(
      (phone) => /^[+()\d\s.-]{5,30}$/.test(phone),
      "Enter a valid phone number",
    ),
    line1: requiredText("Address", 200),
    line2: z.string().trim().max(200).optional(),
    city: requiredText("City", 100),
    state: requiredText("State or region", 100),
    postcode: requiredText("Postcode", 30),
    country: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, "Choose a valid country"),
  })
  .strict();

export const checkoutRequestSchema = z.object({
  items: checkoutItemsSchema,
  address: checkoutAddressSchema,
});

export const paystackOrderItemSchema = z
  .object({
    productId: requiredText("Product ID", 200),
    name: requiredText("Product name", 200),
    quantity: z.number().int().positive().max(100),
    unitPrice: z.number().finite().nonnegative(),
    sizing: checkoutItemSchema.shape.sizing,
    alphaSize: checkoutItemSchema.shape.alphaSize,
  })
  .strict();

export const paystackCheckoutMetadataSchema = z
  .object({
    version: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    clerkUserId: requiredText("Clerk user ID", 200),
    userEmail: z.string().email().max(254),
    sanityCustomerId: requiredText("Customer ID", 200),
    items: z.array(paystackOrderItemSchema).min(1).max(50),
    shippingFee: z.number().finite().nonnegative(),
    serviceCharge: z.number().finite().nonnegative(),
    expectedAmountKobo: z.number().int().positive(),
    address: checkoutAddressSchema,
    cancel_action: z.string().url().optional(),
  })
  .strict();

export type CheckoutAddress = z.infer<typeof checkoutAddressSchema>;
export type CheckoutItem = z.infer<typeof checkoutItemSchema>;
export type PaystackCheckoutMetadata = z.infer<
  typeof paystackCheckoutMetadataSchema
>;
