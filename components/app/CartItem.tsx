"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useCartActions,
  useProductQuantity,
} from "@/lib/store/cart-store-provider";
import { ProductSizingDetails } from "@/components/app/ProductSizingDetails";
import { StockBadge } from "@/components/app/StockBadge";
import { cn, formatPrice } from "@/lib/utils";
import type { CartItem as CartItemType } from "@/lib/store/cart-store";
import type { StockInfo } from "@/lib/hooks/useCartStock";

interface CartItemProps {
  item: CartItemType;
  stockInfo?: StockInfo;
}

export function CartItem({ item, stockInfo }: CartItemProps) {
  const { removeItem, updateQuantity } = useCartActions();
  const productQuantity = useProductQuantity(item.productId);

  const isOutOfStock = stockInfo?.isOutOfStock ?? false;
  const exceedsStock = stockInfo?.exceedsStock ?? false;
  const currentStock = stockInfo?.currentStock ?? 999;
  const hasIssue = isOutOfStock || exceedsStock;
  const isAtMax = productQuantity >= currentStock;

  return (
    <div
      className={cn(
        "flex gap-4 py-4",
        hasIssue && "rounded-lg bg-red-50 p-3 dark:bg-red-950/30",
      )}
    >
      {/* Image */}
      <div
        className={cn(
          "relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800",
          isOutOfStock && "opacity-50",
        )}
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-contain bg-[#e0e0e1]"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-400">
            No image
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <Link
            href={`/shop/products/${item.slug ?? item.productId}`} // Fallback for legacy items
            className={cn(
              "font-medium text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300",
              isOutOfStock && "text-zinc-400 dark:text-zinc-500",
            )}
          >
            {item.name}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-red-500"
            onClick={() => removeItem(item.lineId)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove {item.name}</span>
          </Button>
        </div>

        <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {formatPrice(item.price)}
        </p>
        {(item.sizing || item.alphaSize) && (
          <ProductSizingDetails
            sizing={item.sizing}
            alphaSize={item.alphaSize}
            className="mt-2"
          />
        )}

        {/* Stock Badge & Quantity Controls */}
        <div className="mt-2 flex flex-row justify-between items-center gap-2">
          <StockBadge productId={item.productId} stock={currentStock} />
          {!isOutOfStock && (
            <div className="ml-auto flex h-9 w-32 items-center rounded-md border border-zinc-200 dark:border-zinc-700">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-full flex-1"
                onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="flex-1 text-center text-sm font-semibold tabular-nums">
                {item.quantity}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-full flex-1 disabled:opacity-20"
                onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                disabled={isAtMax}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
