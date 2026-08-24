import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteProductAndRedirect,
  removeProductImage,
  saveProductFromForm,
  uploadProductImage,
} from "@/sanity/lib/admin-actions";
import { getProductById } from "@/sanity/lib/admin-queries";

export const dynamic = "force-dynamic";

const MATERIALS = ["wood", "metal", "fabric", "leather", "glass"];
const COLORS = ["black", "white", "oak", "walnut", "grey", "natural"];

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const saveAction = saveProductFromForm.bind(null, product._id);
  const deleteAction = deleteProductAndRedirect.bind(null, product._id);
  const uploadAction = uploadProductImage.bind(null, product._id);

  return (
    <div className="space-y-4 sm:space-y-6">
      <Link
        href="/admin/inventory"
        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Inventory
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            {product.name ?? "Untitled Product"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Changes are saved securely through the server.
          </p>
        </div>
        <div className="flex gap-2">
          {product.slug && (
            <Button asChild variant="outline">
              <Link href={`/shop/products/${product.slug}`} target="_blank">
                View product
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <form action={deleteAction}>
            <Button type="submit" variant="destructive">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <form action={saveAction} className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={product.name ?? ""} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" defaultValue={product.slug ?? ""} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={product.description ?? ""}
                  rows={5}
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Pricing & Inventory
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₦)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={product.price ?? 1}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={product.stock ?? 0}
                  required
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Attributes
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <select
                  id="material"
                  name="material"
                  defaultValue={product.material ?? ""}
                  className="h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-700"
                >
                  <option value="">Not specified</option>
                  {MATERIALS.map((material) => (
                    <option key={material} value={material}>
                      {material[0].toUpperCase() + material.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <select
                  id="color"
                  name="color"
                  defaultValue={product.color ?? ""}
                  className="h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-700"
                >
                  <option value="">Not specified</option>
                  {COLORS.map((color) => (
                    <option key={color} value={color}>
                      {color[0].toUpperCase() + color.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input
                  id="dimensions"
                  name="dimensions"
                  defaultValue={product.dimensions ?? ""}
                  placeholder='e.g. 120cm x 80cm x 75cm'
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Options
            </h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between gap-4">
                <span>
                  <span className="block font-medium text-zinc-900 dark:text-zinc-100">
                    Featured Product
                  </span>
                  <span className="text-sm text-zinc-500">Show on homepage and promotions</span>
                </span>
                <input
                  type="checkbox"
                  name="featured"
                  defaultChecked={product.featured ?? false}
                  className="h-5 w-5 accent-zinc-900"
                />
              </label>
              <label className="flex items-center justify-between gap-4">
                <span>
                  <span className="block font-medium text-zinc-900 dark:text-zinc-100">
                    Assembly Required
                  </span>
                  <span className="text-sm text-zinc-500">Customer needs to assemble it</span>
                </span>
                <input
                  type="checkbox"
                  name="assemblyRequired"
                  defaultChecked={product.assemblyRequired ?? false}
                  className="h-5 w-5 accent-zinc-900"
                />
              </label>
            </div>
          </section>

          <Button type="submit" size="lg">
            Save product
          </Button>
        </form>

        <aside className="space-y-6">
          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Product Images
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {product.images?.map((image) => (
                <div key={image._key} className="space-y-2">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    {image.url && (
                      <Image
                        src={image.url}
                        alt={product.name ?? "Product image"}
                        fill
                        className="object-cover"
                        sizes="160px"
                      />
                    )}
                  </div>
                  <form action={removeProductImage.bind(null, product._id, image._key)}>
                    <Button type="submit" size="sm" variant="outline" className="w-full">
                      Remove
                    </Button>
                  </form>
                </div>
              ))}
            </div>
            <form action={uploadAction} className="mt-4 space-y-3">
              <Input name="image" type="file" accept="image/*" required />
              <Button type="submit" variant="outline" className="w-full">
                <Upload className="h-4 w-4" />
                Upload image
              </Button>
            </form>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Advanced Editing
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Categories and schema-level fields remain available in Sanity Studio.
              Studio uses Sanity membership authentication separately from Clerk.
            </p>
            <Link
              href={`/studio/structure/product;${product._id}`}
              target="_blank"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-zinc-900 hover:text-zinc-600 dark:text-zinc-100"
            >
              Open Sanity Studio
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
