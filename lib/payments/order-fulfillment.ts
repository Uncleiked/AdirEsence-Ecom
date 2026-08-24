export interface PurchasedItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export type AggregatedPurchasedItem = PurchasedItem;

export interface InventoryProduct {
  _id: string;
  _rev: string;
  stock?: number | null;
}

export interface InventoryShortage {
  productId: string;
  name: string;
  requested: number;
  available: number;
}

export function aggregatePurchasedItems(
  items: PurchasedItem[],
): AggregatedPurchasedItem[] {
  const aggregated = new Map<string, AggregatedPurchasedItem>();

  for (const item of items) {
    const current = aggregated.get(item.productId);
    if (current) {
      current.quantity += item.quantity;
    } else {
      aggregated.set(item.productId, { ...item });
    }
  }

  return Array.from(aggregated.values());
}

export function calculateRemainingStock(
  currentStock: number,
  purchasedQuantity: number,
): number {
  if (
    !Number.isInteger(currentStock) ||
    currentStock < 0 ||
    !Number.isInteger(purchasedQuantity) ||
    purchasedQuantity <= 0 ||
    purchasedQuantity > currentStock
  ) {
    throw new Error("Inventory cannot fulfill the purchased quantity");
  }

  return currentStock - purchasedQuantity;
}

export function findInventoryShortages(
  items: PurchasedItem[],
  products: InventoryProduct[],
): InventoryShortage[] {
  const productsById = new Map(
    products.map((product) => [product._id, product]),
  );

  return aggregatePurchasedItems(items).flatMap((item) => {
    const stock = productsById.get(item.productId)?.stock;
    const available =
      typeof stock === "number" && Number.isFinite(stock)
        ? Math.max(0, Math.floor(stock))
        : 0;

    return available < item.quantity
      ? [
          {
            productId: item.productId,
            name: item.name,
            requested: item.quantity,
            available,
          },
        ]
      : [];
  });
}
