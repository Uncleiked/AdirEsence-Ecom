import { z } from "zod";

const requiredText = (label: string, maxLength: number) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(maxLength, `${label} is too long`);

export const checkoutItemSchema = z
  .object({
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
  })
  .strict();

export const checkoutItemsSchema = z
  .array(checkoutItemSchema)
  .min(1, "Your cart is empty")
  .max(50, "Your cart contains too many items")
  .superRefine((items, context) => {
    const productIds = new Set<string>();

    for (const [index, item] of items.entries()) {
      if (productIds.has(item.productId)) {
        context.addIssue({
          code: "custom",
          path: [index, "productId"],
          message: "Duplicate products are not allowed",
        });
      }
      productIds.add(item.productId);
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
  })
  .strict();

export const paystackCheckoutMetadataSchema = z
  .object({
    version: z.literal(1),
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
  .strict()
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

export type CheckoutAddress = z.infer<typeof checkoutAddressSchema>;
export type CheckoutItem = z.infer<typeof checkoutItemSchema>;
export type PaystackCheckoutMetadata = z.infer<
  typeof paystackCheckoutMetadataSchema
>;
