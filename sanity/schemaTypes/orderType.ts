import { BasketIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";
import { ORDER_STATUS_SANITY_LIST } from "@/lib/constants/orderStatus";

export const orderType = defineType({
  name: "order",
  title: "Order",
  type: "document",
  icon: BasketIcon,
  groups: [
    { name: "details", title: "Order Details", default: true },
    { name: "customer", title: "Customer" },
    { name: "payment", title: "Payment" },
  ],
  fields: [
    defineField({
      name: "orderNumber",
      type: "string",
      group: "details",
      readOnly: true,
      validation: (rule) => [rule.required().error("Order number is required")],
    }),
    defineField({
      name: "items",
      type: "array",
      group: "details",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "product",
              type: "reference",
              to: [{ type: "product" }],
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "quantity",
              type: "number",
              initialValue: 1,
              validation: (rule) => rule.required().min(1),
            }),
            defineField({
              name: "priceAtPurchase",
              type: "number",
              description: "Price at time of purchase",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "sizing",
              title: "Garment measurements",
              type: "object",
              readOnly: true,
              fields: [
                defineField({ name: "version", type: "number" }),
                defineField({
                  name: "mode",
                  type: "string",
                  options: {
                    list: [
                      { title: "Trouser", value: "trouser" },
                      { title: "Shorts / jorts", value: "shorts" },
                      { title: "Skirt", value: "skirt" },
                    ],
                  },
                }),
                defineField({
                  name: "fitProfile",
                  title: "Fit profile",
                  type: "string",
                  options: {
                    list: [
                      { title: "Men's cut", value: "men" },
                      { title: "Women's cut", value: "women" },
                      { title: "Unisex / custom cut", value: "unisex" },
                    ],
                  },
                }),
                defineField({
                  name: "unit",
                  type: "string",
                  options: {
                    list: [
                      { title: "Inches", value: "in" },
                      { title: "Centimetres", value: "cm" },
                    ],
                  },
                }),
                defineField({ name: "waist", type: "number" }),
                defineField({ name: "hip", title: "Hip / seat", type: "number" }),
                defineField({ name: "length", type: "number" }),
                defineField({
                  name: "lengthType",
                  title: "Length measurement",
                  type: "string",
                  options: {
                    list: [
                      { title: "Inside leg", value: "insideLeg" },
                      { title: "Shorts inseam", value: "shortInseam" },
                      { title: "Skirt length", value: "skirtLength" },
                    ],
                  },
                }),
              ],
            }),
            defineField({
              name: "alphaSize",
              title: "Selected size",
              type: "string",
              readOnly: true,
              options: {
                list: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
              },
            }),
          ],
          preview: {
            select: {
              title: "product.name",
              quantity: "quantity",
              price: "priceAtPurchase",
              media: "product.images.0",
            },
            prepare({ title, quantity, price, media }) {
              return {
                title: title ?? "Product",
                subtitle: `Qty: ${quantity} • ₦${price}`,
                media,
              };
            },
          },
        }),
      ],
    }),
    defineField({
      name: "total",
      type: "number",
      group: "details",
      readOnly: true,
      description: "Total order amount in NGN",
    }),
    defineField({
      name: "status",
      type: "string",
      group: "details",
      initialValue: "paid",
      options: {
        list: ORDER_STATUS_SANITY_LIST,
        layout: "radio",
      },
    }),
    defineField({
      name: "customer",
      type: "reference",
      to: [{ type: "customer" }],
      group: "customer",
      description: "Reference to the customer record",
    }),
    defineField({
      name: "clerkUserId",
      type: "string",
      group: "customer",
      readOnly: true,
      description: "Clerk user ID",
    }),
    defineField({
      name: "email",
      type: "string",
      group: "customer",
      readOnly: true,
    }),
    defineField({
      name: "address",
      type: "object",
      group: "customer",
      fields: [
        defineField({ name: "name", type: "string", title: "Full Name" }),
        defineField({ name: "line1", type: "string", title: "Address Line 1" }),
        defineField({ name: "line2", type: "string", title: "Address Line 2" }),
        defineField({ name: "city", type: "string" }),
        defineField({ name: "state", type: "string", title: "State / Region" }),
        defineField({ name: "postcode", type: "string", title: "Postcode" }),
        defineField({ name: "country", type: "string" }),
        defineField({ name: "email", type: "string", title: "Contact Email" }),
        defineField({ name: "phone", type: "string", title: "Phone" }),
      ],
    }),
    defineField({
      name: "paymentId",
      type: "string",
      group: "payment",
      readOnly: true,
      description: "Generic payment transaction or reference ID",
    }),
    defineField({
      name: "paymentProvider",
      type: "string",
      group: "payment",
      readOnly: true,
      description: "Payment gateway provider used for transaction (Paystack)",
    }),
    defineField({
      name: "shippingFee",
      type: "number",
      group: "details",
      readOnly: true,
      description: "Shipping and transportation fee charged in NGN",
    }),
    defineField({
      name: "serviceCharge",
      type: "number",
      group: "details",
      readOnly: true,
      description: "Payment gateway service charge fee in NGN",
    }),
    defineField({
      name: "createdAt",
      type: "datetime",
      group: "details",
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "inventoryIssue",
      title: "Inventory Issue",
      type: "object",
      group: "details",
      readOnly: true,
      hidden: ({ document }) => document?.status !== "inventory_issue",
      fields: [
        defineField({ name: "reason", type: "text", rows: 3 }),
        defineField({ name: "detectedAt", type: "datetime" }),
        defineField({
          name: "items",
          type: "array",
          of: [
            defineArrayMember({
              type: "object",
              fields: [
                defineField({ name: "productId", type: "string" }),
                defineField({ name: "name", type: "string" }),
                defineField({ name: "requested", type: "number" }),
                defineField({ name: "available", type: "number" }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      orderNumber: "orderNumber",
      email: "email",
      total: "total",
      status: "status",
    },
    prepare({ orderNumber, email, total, status }) {
      return {
        title: `Order ${orderNumber ?? "N/A"}`,
        subtitle: `${email ?? "No email"} • ₦${total ?? 0} • ${status ?? "paid"}`,
      };
    },
  },
  orderings: [
    {
      title: "Newest First",
      name: "createdAtDesc",
      by: [{ field: "createdAt", direction: "desc" }],
    },
  ],
});
