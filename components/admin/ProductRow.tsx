import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Star } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { isLowStock, isOutOfStock } from "@/lib/constants/stock";
import { StockInput } from "./StockInput";
import { PriceInput } from "./PriceInput";
import { FeaturedToggle } from "./FeaturedToggle";
// No longer need PublishButton/RevertButton as we mutate directly via Server Actions

interface ProductRowProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    stock: number;
    price: number;
    featured: boolean;
    category: {
      title: string;
    } | null;
    image: {
      asset: {
        url: string;
      } | null;
    } | null;
  };
}

export function ProductRow({ product }: ProductRowProps) {
  if (!product) return null;

  const lowStock = isLowStock(product.stock);
  const outOfStock = isOutOfStock(product.stock);

  return (
    <TableRow className="group">
      {/* Image - Desktop only */}
      <TableCell className="hidden py-3 sm:table-cell">
        <div className="relative h-12 w-12 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
          {product.image?.asset?.url ? (
            <Image
              src={product.image.asset.url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-zinc-400">
              ?
            </div>
          )}
        </div>
      </TableCell>

      {/* Name - Mobile: includes image, price, stock badges */}
      <TableCell className="py-3 sm:py-4">
        <Link
          href={`/admin/inventory/${product._id}`}
          className="flex items-start gap-3 sm:block"
        >
          {/* Mobile image */}
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800 sm:hidden">
            {product.image?.asset?.url ? (
              <Image
                src={product.image.asset.url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                ?
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-medium text-zinc-900 group-hover:text-zinc-600 dark:text-zinc-100 dark:group-hover:text-zinc-300 sm:hover:text-zinc-600 sm:dark:hover:text-zinc-300">
                {product.name || "Untitled Product"}
              </span>
              {product.featured && (
                <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400 sm:hidden" />
              )}
              {product.slug && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(`/products/${product.slug}`, "_blank");
                  }}
                  className="hidden shrink-0 opacity-0 transition-opacity group-hover:opacity-100 sm:block"
                  aria-label="View product on store"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-600" />
                </button>
              )}
            </div>
            {product.category && (
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {product.category.title}
              </p>
            )}
            {/* Mobile: show price and stock inline */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs sm:hidden">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {formatPrice(product.price)}
              </span>
              <span className="text-zinc-300 dark:text-zinc-600">•</span>
              <span className="text-zinc-500 dark:text-zinc-400">
                {product.stock} in stock
              </span>
              {outOfStock && (
                <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                  Out
                </Badge>
              )}
              {lowStock && (
                <Badge
                  variant="secondary"
                  className="h-5 bg-amber-100 px-1.5 text-[10px] text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                >
                  Low
                </Badge>
              )}
            </div>
          </div>
        </Link>
      </TableCell>

      {/* Price - Desktop only */}
      <TableCell className="hidden py-4 md:table-cell">
        <PriceInput id={product._id} initialPrice={product.price} />
      </TableCell>

      {/* Stock - Desktop only */}
      <TableCell className="hidden py-4 md:table-cell">
        <div className="flex items-center gap-2">
          <StockInput id={product._id} initialStock={product.stock} />
          {outOfStock && (
            <Badge variant="destructive" className="text-xs">
              Out
            </Badge>
          )}
          {lowStock && (
            <Badge
              variant="secondary"
              className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
            >
              Low
            </Badge>
          )}
        </div>
      </TableCell>

      {/* Featured - Desktop only */}
      <TableCell className="hidden py-4 lg:table-cell">
        <FeaturedToggle id={product._id} initialFeatured={product.featured} />
      </TableCell>

      {/* Actions - Desktop only 
      <TableCell className="hidden py-4 sm:table-cell">
        <div className="flex items-center justify-end gap-2">
          {/* Actions can go here if needed ->
        </div>
      </TableCell> */}
    </TableRow>
  );
}

// Added empty skeleton export to avoid breaking layout usage if any still relies on it
export function ProductRowSkeleton() {
  return null;
}
