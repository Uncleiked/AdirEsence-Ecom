import { UserIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const customerType = defineType({
  name: "customer",
  title: "Customer",
  type: "document",
  icon: UserIcon,
  groups: [
    { name: "details", title: "Customer Details", default: true },
    { name: "paystack", title: "Paystack" },
  ],
  fields: [
    defineField({
      name: "email",
      type: "string",
      group: "details",
      validation: (rule) => rule.required().error("Email is required"),
    }),
    defineField({
      name: "name",
      type: "string",
      group: "details",
      description: "Customer's full name",
    }),
    defineField({
      name: "clerkUserId",
      type: "string",
      group: "details",
      description: "Clerk user ID for authentication",
    }),
    defineField({
      name: "paystackCustomerCode",
      type: "string",
      group: "paystack",
      readOnly: true,
      description: "Paystack customer code for payments",
    }),
    defineField({
      name: "createdAt",
      type: "datetime",
      group: "details",
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      email: "email",
      name: "name",
      paystackCustomerCode: "paystackCustomerCode",
    },
    prepare({
      email,
      name,
      paystackCustomerCode,
    }: {
      email?: string;
      name?: string;
      paystackCustomerCode?: string;
    }) {
      return {
        title: name ?? email ?? "Unknown Customer",
        subtitle: paystackCustomerCode
          ? `${email ?? ""} • ${paystackCustomerCode}`
          : (email ?? ""),
      };
    },
  },
  orderings: [
    {
      title: "Newest First",
      name: "createdAtDesc",
      by: [{ field: "createdAt", direction: "desc" }],
    },
    {
      title: "Email A-Z",
      name: "emailAsc",
      by: [{ field: "email", direction: "asc" }],
    },
  ],
});
