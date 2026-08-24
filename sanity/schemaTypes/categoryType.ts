import { TagIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const categoryType = defineType({
  name: "category",
  title: "Category",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => [
        rule.required().error("Category title is required"),
      ],
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) => [
        rule.required().error("Slug is required for URL generation"),
      ],
    }),
    defineField({
      name: "image",
      type: "image",
      options: {
        hotspot: true,
      },
      description: "Category thumbnail image",
    }),
    defineField({
      name: "sizingMode",
      title: "Required product sizing",
      type: "string",
      initialValue: "none",
      description:
        "Require a letter size or body measurements for products in this category.",
      options: {
        list: [
          { title: "No sizing", value: "none" },
          { title: "Shirts / tops — S to 4XL", value: "alpha" },
          { title: "Trousers — waist, hip and inside leg", value: "trouser" },
          { title: "Shorts / jorts — waist, hip and inseam", value: "shorts" },
          { title: "Skirts — waist, hip and waist-to-hem length", value: "skirt" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "image",
    },
  },
});
