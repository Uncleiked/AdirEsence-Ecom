import "server-only";

import { groq } from "next-sanity";
import { writeClient } from "./client";
import { requireAdminAccess } from "./auth";
import type { AlphaSize, GarmentSizing } from "@/lib/sizing/garment-sizing";

const SANITY_DOCUMENT_ID_PATTERN = /^[A-Za-z0-9_.-]{1,128}$/;
const adminFetchOptions = {
  cache: "no-store" as const,
  perspective: "published" as const,
  stega: false,
};

export interface AdminProductSummary {
  _id: string;
  name: string | null;
  slug: string | null;
  price: number | null;
  stock: number | null;
  featured: boolean | null;
  category: string | null;
  imageUrl: string | null;
}

export interface AdminProductImage {
  _key: string;
  assetRef: string;
  url: string | null;
}

export interface AdminProductDetail extends AdminProductSummary {
  description: string | null;
  material: string | null;
  color: string | null;
  dimensions: string | null;
  assemblyRequired: boolean | null;
  images: AdminProductImage[];
}

export interface AdminOrderSummary {
  _id: string;
  orderNumber: string | null;
  email: string | null;
  total: number | null;
  status: string | null;
  createdAt: string | null;
  itemCount: number;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  paymentId: string | null;
  paymentProvider: string | null;
  shippingFee: number | null;
  serviceCharge: number | null;
  inventoryIssue: {
    reason: string | null;
    items: Array<{
      _key: string;
      name: string | null;
      requested: number | null;
      available: number | null;
    }>;
  } | null;
  address: {
    name: string | null;
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postcode: string | null;
    country: string | null;
    phone: string | null;
  } | null;
  items: Array<{
    _key: string;
    quantity: number | null;
    priceAtPurchase: number | null;
    sizing: GarmentSizing | null;
    alphaSize: AlphaSize | null;
    product: {
      _id: string;
      name: string | null;
      slug: string | null;
      imageUrl: string | null;
    } | null;
  }>;
}

export interface AdminDashboardData {
  stats: {
    totalProducts: number;
    totalOrders: number;
    lowStockProducts: number;
  };
  recentOrders: AdminOrderSummary[];
  lowStock: AdminProductSummary[];
}

const PRODUCT_SUMMARY_PROJECTION = groq`{
  _id,
  name,
  "slug": slug.current,
  price,
  stock,
  featured,
  "category": category->title,
  "imageUrl": images[0].asset->url
}`;

const ORDER_SUMMARY_PROJECTION = groq`{
  _id,
  orderNumber,
  email,
  total,
  status,
  createdAt,
  "itemCount": count(items)
}`;

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  await requireAdminAccess();

  return writeClient.fetch<AdminDashboardData>(
    groq`{
      "stats": {
        "totalProducts": count(*[_type == "product"]),
        "totalOrders": count(*[_type == "order"]),
        "lowStockProducts": count(*[_type == "product" && stock <= 5])
      },
      "recentOrders": *[_type == "order"] | order(createdAt desc)[0...5]
        ${ORDER_SUMMARY_PROJECTION},
      "lowStock": *[_type == "product" && stock <= 5] | order(stock asc)[0...5]
        ${PRODUCT_SUMMARY_PROJECTION}
    }`,
    {},
    adminFetchOptions,
  );
}

export async function getAllProducts(): Promise<AdminProductSummary[]> {
  await requireAdminAccess();

  return writeClient.fetch<AdminProductSummary[]>(
    groq`*[_type == "product"] | order(stock asc, name asc)
      ${PRODUCT_SUMMARY_PROJECTION}`,
    {},
    adminFetchOptions,
  );
}

export async function getProductById(
  id: string,
): Promise<AdminProductDetail | null> {
  await requireAdminAccess();
  if (!SANITY_DOCUMENT_ID_PATTERN.test(id)) return null;

  return writeClient.fetch<AdminProductDetail | null>(
    groq`*[_type == "product" && _id == $id][0]{
      _id,
      name,
      "slug": slug.current,
      price,
      stock,
      featured,
      "category": category->title,
      "imageUrl": images[0].asset->url,
      description,
      material,
      color,
      dimensions,
      assemblyRequired,
      "images": images[]{
        _key,
        "assetRef": asset._ref,
        "url": asset->url
      }
    }`,
    { id },
    adminFetchOptions,
  );
}

export async function getAllOrders(): Promise<AdminOrderSummary[]> {
  await requireAdminAccess();

  return writeClient.fetch<AdminOrderSummary[]>(
    groq`*[_type == "order"] | order(createdAt desc)
      ${ORDER_SUMMARY_PROJECTION}`,
    {},
    adminFetchOptions,
  );
}

export async function getOrderById(
  id: string,
): Promise<AdminOrderDetail | null> {
  await requireAdminAccess();
  if (!SANITY_DOCUMENT_ID_PATTERN.test(id)) return null;

  return writeClient.fetch<AdminOrderDetail | null>(
    groq`*[_type == "order" && _id == $id][0]{
      _id,
      orderNumber,
      email,
      total,
      status,
      createdAt,
      "itemCount": count(items),
      paymentId,
      paymentProvider,
      shippingFee,
      serviceCharge,
      inventoryIssue{
        reason,
        items[]{ _key, name, requested, available }
      },
      address{
        name,
        line1,
        line2,
        city,
        state,
        postcode,
        country,
        phone
      },
      items[]{
        _key,
        quantity,
        priceAtPurchase,
        sizing{
          version,
          mode,
          fitProfile,
          unit,
          waist,
          hip,
          length,
          lengthType
        },
        alphaSize,
        product->{
          _id,
          name,
          "slug": slug.current,
          "imageUrl": images[0].asset->url
        }
      }
    }`,
    { id },
    adminFetchOptions,
  );
}
