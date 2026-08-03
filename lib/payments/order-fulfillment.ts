export interface PurchasedItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

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

  return items.flatMap((item) => {
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
