import { Suspense } from "react";
import Link from "next/link";
import { Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody } from "@/components/ui/table";
import {
  ProductRow,
  ProductTableHeader,
} from "@/components/admin";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";

// We need a simple client search component to update the URL
import { InventorySearch } from "./InventorySearch";

async function getProducts(searchQuery: string = "") {
  let query = groq`*[_type == "product"`;
  
  if (searchQuery) {
    query += ` && name match "*${searchQuery}*"`;
  }
  
  query += `] | order(stock asc, name asc) {
    _id,
    name,
    "slug": slug.current,
    stock,
    price,
    featured,
    "category": category->{
      title
    },
    "image": images[0]{
      asset->{
        url
      }
    }
  }`;
  
  return client.fetch(query);
}

export default async function InventoryPage(props: {
  searchParams: Promise<{ query?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams.query || "";
  const products = await getProducts(query);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Inventory
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
            Manage your product stock and pricing
          </p>
        </div>
        <Link href="/admin/inventory/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Product
          </Button>
        </Link>
      </div>

      {/* Search */}
      <InventorySearch initialQuery={query} />

      {/* Product List */}
      <Suspense fallback={<div>Loading mapping...</div>}>
        {products.length === 0 ? (
          <EmptyState
            icon={Package}
            title={query ? "No products found" : "No products yet"}
            description={
              query
                ? "Try adjusting your search terms."
                : "Get started by adding your first product."
            }
            action={
              !query
                ? {
                    label: "Add Product",
                    onClick: () => {
                      // This is a server component, so we link instead
                    },
                    icon: Plus,
                  }
                : undefined
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <Table>
              <ProductTableHeader />
              <TableBody>
                {products.map((product: any) => (
                  <ProductRow key={product._id} product={product} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Suspense>
    </div>
  );
}
