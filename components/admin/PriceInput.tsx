"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { updateProductPrice } from "@/sanity/lib/admin-actions";

export function PriceInput({ id, initialPrice }: { id: string, initialPrice: number }) {
  const [price, setPrice] = useState(initialPrice);

  const handleBlur = async () => {
    if (price !== initialPrice) {
      await updateProductPrice(id, price);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-sm text-zinc-500">₦</span>
      <Input
        type="number"
        min={0}
        step={0.01}
        value={price}
        onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
        onBlur={handleBlur}
        className="h-8 w-24 text-right"
      />
    </div>
  );
}
