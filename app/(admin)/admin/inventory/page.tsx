import Image from "next/image";
import Link from "next/link";
import { Package, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/utils";
import { createProductAndRedirect } from "@/sanity/lib/admin-actions";
import { getAllProducts } from "@/sanity/lib/admin-queries";

export const dynamic = "force-dynamic";

interface InventoryPageProps {
  searchParams: Promise<{ q?: string; filter?: string }>;
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const [{ q = "", filter }, products] = await Promise.all([
    searchParams,
    getAllProducts(),
  ]);
  const search = q.trim().toLowerCase();
  const visibleProducts = products.filter((product) => {
    if (filter === "low-stock" && (product.stock ?? 0) > 5) return false;
    if (!search) return true;
    return [product.name, product.slug, product.category]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(search));
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Inventory
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
            Manage product details, pricing, and stock
          </p>
        </div>
        <form action={createProductAndRedirect}>
          <Button type="submit" className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            New Product
          </Button>
        </form>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form className="flex w-full gap-2 sm:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search products..."
              className="pl-9"
            />
          </div>
          {filter && <input type="hidden" name="filter" value={filter} />}
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
        <div className="flex gap-2">
          <Button asChild size="sm" variant={!filter ? "default" : "outline"}>
            <Link href="/admin/inventory">All</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant={filter === "low-stock" ? "default" : "outline"}
          >
            <Link href="/admin/inventory?filter=low-stock">Low stock</Link>
          </Button>
        </div>
      </div>

      {visibleProducts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
          <Package className="mx-auto h-10 w-10 text-zinc-400" />
          <h2 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-100">
            No products found
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Try another search or create a product.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="hidden md:table-cell">Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="hidden lg:table-cell">Category</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleProducts.map((product) => {
                const stock = product.stock ?? 0;
                return (
                  <TableRow key={product._id}>
                    <TableCell>
                      <div className="relative h-12 w-12 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name ?? "Product"}
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
                    <TableCell>
                      <Link
                        href={`/admin/inventory/${product._id}`}
                        className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                      >
                        {product.name ?? "Untitled Product"}
                      </Link>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {product.featured && <Badge variant="secondary">Featured</Badge>}
                        <span className="text-xs text-zinc-500 md:hidden">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatPrice(product.price)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={stock <= 0 ? "destructive" : "secondary"}
                        className={
                          stock > 0 && stock <= 5
                            ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                            : undefined
                        }
                      >
                        {stock}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {product.category ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/inventory/${product._id}`}>Edit</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
