import "server-only";

import { writeClient } from "@/sanity/lib/client";
import {
  ORDER_BY_ID_QUERY,
  ORDERS_BY_USER_QUERY,
} from "@/lib/sanity/queries/orders";
import type {
  ORDER_BY_ID_QUERYResult,
  ORDERS_BY_USER_QUERYResult,
} from "@/sanity.types";

const SANITY_DOCUMENT_ID_PATTERN = /^[A-Za-z0-9_.-]{1,128}$/;

const privateOrderFetchOptions = {
  cache: "no-store" as const,
  perspective: "published" as const,
  stega: false,
};

/**
 * Customer order history is identity-scoped and must never use the shared
 * Sanity Live/Next.js content cache.
 */
export async function getCustomerOrders(
  clerkUserId: string,
): Promise<ORDERS_BY_USER_QUERYResult> {
  if (!clerkUserId) return [];

  return writeClient.fetch<ORDERS_BY_USER_QUERYResult>(
    ORDERS_BY_USER_QUERY,
    { clerkUserId },
    privateOrderFetchOptions,
  );
}

export async function getCustomerOrderById(
  id: string,
  clerkUserId: string,
): Promise<ORDER_BY_ID_QUERYResult> {
  if (!clerkUserId || !SANITY_DOCUMENT_ID_PATTERN.test(id)) return null;

  const order = await writeClient.fetch<ORDER_BY_ID_QUERYResult>(
    ORDER_BY_ID_QUERY,
    { id },
    privateOrderFetchOptions,
  );

  return order?.clerkUserId === clerkUserId ? order : null;
}
