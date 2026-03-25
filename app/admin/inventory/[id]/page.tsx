import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import { ProductEditor } from "@/components/admin";

async function getProduct(id: string) {
  if (id === "new") return null;

  return client.fetch(
    groq`*[_type == "product" && _id == $id][0] {
      _id,
      name,
      "slug": slug.current,
      description,
      price,
      stock,
      material,
      color,
      dimensions,
      featured,
      assemblyRequired,
      "category": category->{
        title
      },
      images[]{
        _key,
        _type,
        "asset": asset->{
          _ref,
          url
        }
      }
    }`,
    { id }
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (id !== "new" && !product) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Link href="/admin/inventory" className="text-blue-500 hover:underline">
          Return to inventory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/inventory"
        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Inventory
      </Link>

      {/* Product Detail */}
      <Suspense fallback={<div>Loading editor...</div>}>
        <ProductEditor product={product} isNew={id === "new"} />
      </Suspense>
    </div>
  );
}
