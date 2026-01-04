"use server";

import { sanityFetch } from "@/sanity/lib/live";
import { PRODUCTS_BY_IDS_QUERY } from "@/lib/sanity/queries/products";

export async function fetchProductStock(productIds: string[]) {
  const { data } = await sanityFetch({
    query: PRODUCTS_BY_IDS_QUERY,
    params: {
      ids: productIds,
    },
  });
  return data;
}
