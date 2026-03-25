"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { updateProductStock } from "@/sanity/lib/admin-actions";

export function StockInput({ id, initialStock }: { id: string, initialStock: number }) {
  const [stock, setStock] = useState(initialStock);

  const handleBlur = async () => {
    if (stock !== initialStock) {
      await updateProductStock(id, stock);
    }
  };

  const isLowStock = stock > 0 && stock <= 5;
  const isOutOfStock = stock === 0;

  return (
    <Input
      type="number"
      min={0}
      value={stock}
      onChange={(e) => setStock(parseInt(e.target.value) || 0)}
      onBlur={handleBlur}
      className={cn(
        "h-8 w-20 text-center",
        isOutOfStock &&
          "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20",
        isLowStock &&
          "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20",
      )}
    />
  );
}
