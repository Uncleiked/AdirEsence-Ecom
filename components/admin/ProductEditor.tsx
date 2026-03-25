"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeleteButton, ImageUploader } from "@/components/admin";
import { updateProductBase } from "@/sanity/lib/admin-actions";

const MATERIALS = [
  { value: "wood", label: "Wood" },
  { value: "metal", label: "Metal" },
  { value: "fabric", label: "Fabric" },
  { value: "leather", label: "Leather" },
  { value: "glass", label: "Glass" },
];

const COLORS = [
  { value: "black", label: "Black" },
  { value: "white", label: "White" },
  { value: "oak", label: "Oak" },
  { value: "walnut", label: "Walnut" },
  { value: "grey", label: "Grey" },
  { value: "natural", label: "Natural" },
];

export function ProductEditor({ product, isNew }: { product: any; isNew: boolean }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    description: product?.description || "",
    price: product?.price || 0,
    stock: product?.stock || 0,
    material: product?.material || "",
    color: product?.color || "",
    dimensions: product?.dimensions || "",
    featured: product?.featured || false,
    assemblyRequired: product?.assemblyRequired || false,
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In Sanity, slug is an object { _type: 'slug', current: 'value' }
      const submitData = {
        ...formData,
        slug: { _type: "slug", current: formData.slug },
      };
      
      const result = await updateProductBase(isNew ? "new" : product._id, submitData);
      
      if (result.success && isNew) {
        router.push(`/admin/inventory/${result.id}`);
      } else {
         alert("Saved successfully!");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to save product.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            {formData.name || "New Product"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {isNew ? "Create a new product" : "Edit product details"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && <DeleteButton id={product._id} />}
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isNew ? "Create Product" : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Main Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Info */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Product name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => handleChange("slug", e.target.value)}
                  placeholder="product-slug"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Product description..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Pricing & Inventory
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₦)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    handleChange("price", parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) =>
                    handleChange("stock", parseInt(e.target.value) || 0)
                  }
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Attributes */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Attributes
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Material</Label>
                <Select
                  value={formData.material}
                  onValueChange={(value) => handleChange("material", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIALS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => handleChange("color", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLORS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Dimensions</Label>
                <Input
                  value={formData.dimensions}
                  onChange={(e) => handleChange("dimensions", e.target.value)}
                  placeholder='e.g., "120cm x 80cm x 75cm"'
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Options
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    Featured Product
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Show on homepage and promotions
                  </p>
                </div>
                <Switch
                  checked={formData.featured}
                  onCheckedChange={(checked) => handleChange("featured", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    Assembly Required
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Customer will need to assemble
                  </p>
                </div>
                <Switch
                  checked={formData.assemblyRequired}
                  onCheckedChange={(checked) => handleChange("assemblyRequired", checked)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Image Upload */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Product Images
            </h2>
            {!isNew ? (
              <ImageUploader id={product._id} initialImages={product?.images || []} />
            ) : (
              <p className="text-sm text-zinc-500">Save the product first to upload images.</p>
            )}
            {/* Store Link omitted for now or can be added */}
          </div>
        </div>
      </div>
    </div>
  );
}
