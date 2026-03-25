import Link from "next/link";
import Image from "next/image";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getLowStockProducts } from "@/sanity/lib/admin-queries";

export async function LowStockAlert() {
  const lowStockProducts = await getLowStockProducts(5);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
          Low Stock Alerts
        </h2>
      </div>
      <div className="p-4">
        {lowStockProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              All products are well stocked!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {lowStockProducts.map((product: any) => {
              const isOutOfStock = product.stock === 0;
              return (
                <Link
                  key={product._id}
                  href={`/admin/inventory/${product._id}`}
                  className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-3 transition-colors hover:border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-zinc-200 dark:bg-zinc-700">
                    {product.image?.asset?.url ? (
                      <Image
                        src={product.image.asset.url}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                        ?
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {product.name}
                    </p>
                  </div>
                  <Badge
                    variant={isOutOfStock ? "destructive" : "secondary"}
                    className="shrink-0"
                  >
                    {isOutOfStock ? "Out of stock" : `${product.stock} left`}
                  </Badge>
                </Link>
              );
            })}
            <Link
              href="/admin/inventory?filter=low-stock"
              className="block pt-2 text-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              View all inventory →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
