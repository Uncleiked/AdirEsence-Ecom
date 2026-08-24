"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { fetchProductStock } from "@/lib/actions/stock";
import type { CartItem } from "@/lib/store/cart-store";

export interface StockInfo {
  productId: string;
  currentStock: number;
  isOutOfStock: boolean;
  exceedsStock: boolean;
  availableQuantity: number;
}

export type StockMap = Map<string, StockInfo>;

interface UseCartStockReturn {
  stockMap: StockMap;
  isLoading: boolean;
  hasStockIssues: boolean;
  refetch: () => void;
}

/**
 * Fetches current stock levels for cart items
 * Returns stock info map and loading state
 */
export function useCartStock(items: CartItem[]): UseCartStockReturn {
  const [stockMap, setStockMap] = useState<StockMap>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Memoize product IDs to use as stable dependency
  const productIds = useMemo(
    () => Array.from(new Set(items.map((item) => item.productId))),
    [items],
  );

  const fetchStock = useCallback(async () => {
    if (items.length === 0) {
      setStockMap(new Map());
      return;
    }

    setIsLoading(true);

    try {
      const products = await fetchProductStock(productIds);

      const newStockMap = new Map<string, StockInfo>();
      const quantitiesByProduct = new Map<string, number>();

      for (const item of items) {
        quantitiesByProduct.set(
          item.productId,
          (quantitiesByProduct.get(item.productId) ?? 0) + item.quantity,
        );
      }

      for (const item of items) {
        const product = products.find(
          (p: { _id: string }) => p._id === item.productId
        );
        const currentStock = product?.stock ?? 0;
        const requestedQuantity = quantitiesByProduct.get(item.productId) ?? 0;

        newStockMap.set(item.lineId, {
          productId: item.productId,
          currentStock,
          isOutOfStock: currentStock === 0,
          exceedsStock: requestedQuantity > currentStock,
          availableQuantity: Math.min(requestedQuantity, currentStock),
        });
      }

      setStockMap(newStockMap);
    } catch (error) {
      console.error("Failed to fetch stock:", error);
    } finally {
      setIsLoading(false);
    }
  }, [items, productIds]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const hasStockIssues = Array.from(stockMap.values()).some(
    (info) => info.isOutOfStock || info.exceedsStock
  );

  return {
    stockMap,
    isLoading,
    hasStockIssues,
    refetch: fetchStock,
  };
}
