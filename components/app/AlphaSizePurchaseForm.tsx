"use client";

import { useState } from "react";
import { Shirt, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useCartActions,
  useProductQuantity,
} from "@/lib/store/cart-store-provider";
import { ALPHA_SIZES, type AlphaSize } from "@/lib/sizing/garment-sizing";
import { cn } from "@/lib/utils";

interface AlphaSizePurchaseFormProps {
  productId: string;
  name: string;
  price: number;
  image?: string;
  stock: number;
  slug: string;
}

export function AlphaSizePurchaseForm({
  productId,
  name,
  price,
  image,
  stock,
  slug,
}: AlphaSizePurchaseFormProps) {
  const { addItem, openCart } = useCartActions();
  const productQuantity = useProductQuantity(productId);
  const [selectedSize, setSelectedSize] = useState<AlphaSize | null>(null);
  const isOutOfStock = stock <= 0;
  const isAtMax = productQuantity >= stock;

  const handleAdd = () => {
    if (!selectedSize) {
      toast.error("Choose a shirt size");
      return;
    }
    if (isOutOfStock || isAtMax) return;

    addItem(
      { productId, name, price, image, slug, alphaSize: selectedSize },
      1,
    );
    openCart();
    toast.success(`Added ${name} in size ${selectedSize}`);
  };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-zinc-100 p-2 dark:bg-zinc-900">
          <Shirt className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-semibold">Select your size</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            A size is required before this product can be added to your basket.
          </p>
        </div>
      </div>

      <div
        className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-7"
        role="radiogroup"
        aria-label="Shirt size"
      >
        {ALPHA_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            role="radio"
            aria-checked={selectedSize === size}
            onClick={() => setSelectedSize(size)}
            className={cn(
              "h-11 rounded-md border text-sm font-semibold transition-colors",
              selectedSize === size
                ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600",
            )}
          >
            {size}
          </button>
        ))}
      </div>

      <Button
        type="button"
        onClick={handleAdd}
        disabled={isOutOfStock || isAtMax}
        className="mt-5 h-11 w-full"
      >
        <ShoppingBag className="mr-2 h-4 w-4" />
        {isOutOfStock
          ? "Out of stock"
          : isAtMax
            ? "Maximum available quantity in basket"
            : selectedSize
              ? `Add size ${selectedSize} to basket`
              : "Choose a size"}
      </Button>
    </section>
  );
}
