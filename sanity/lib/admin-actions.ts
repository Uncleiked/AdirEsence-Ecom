"use server";

import { writeClient } from "./client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAccess } from "./auth";

const SANITY_DOCUMENT_ID_PATTERN = /^[A-Za-z0-9_.-]{1,128}$/;
const SANITY_ARRAY_KEY_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

function assertDocumentId(id: string) {
  if (!SANITY_DOCUMENT_ID_PATTERN.test(id)) {
    throw new Error("Invalid Sanity document ID");
  }
}

function formText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function formNumber(formData: FormData, name: string): number {
  const value = Number(formText(formData, name));
  return Number.isFinite(value) ? value : 0;
}

export async function updateProductStock(id: string, newStock: number) {
  await requireAdminAccess();

  try {
    await writeClient
      .patch(id)
      .set({ stock: newStock })
      .commit();
    revalidatePath("/admin/inventory");
    revalidatePath(`/admin/inventory/${id}`);
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update stock:", error);
    return { success: false, error: "Failed to update stock" };
  }
}

export async function updateProductPrice(id: string, newPrice: number) {
  await requireAdminAccess();

  try {
    await writeClient
      .patch(id)
      .set({ price: newPrice })
      .commit();
    revalidatePath("/admin/inventory");
    revalidatePath(`/admin/inventory/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update price:", error);
    return { success: false, error: "Failed to update price" };
  }
}

export async function toggleProductFeatured(id: string, isFeatured: boolean) {
  await requireAdminAccess();

  try {
    await writeClient
      .patch(id)
      .set({ featured: isFeatured })
      .commit();
    revalidatePath("/admin/inventory");
    revalidatePath(`/admin/inventory/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle featured status:", error);
    return { success: false, error: "Failed to toggle featured status" };
  }
}

export async function updateProductBase(
  id: string,
  data: Record<string, unknown>,
) {
  await requireAdminAccess();

  try {
    if (id === "new") {
      // Create new product
      const newDoc = {
        _type: "product",
        ...data,
      };
      const result = await writeClient.create(newDoc);
      revalidatePath("/admin/inventory");
      return { success: true, id: result._id };
    }

    // Update existing product
    await writeClient
      .patch(id)
      .set(data)
      .commit();
    revalidatePath("/admin/inventory");
    revalidatePath(`/admin/inventory/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update product:", error);
    return { success: false, error: "Failed to update product" };
  }
}

export async function updateProductImages(id: string, images: unknown[]) {
  await requireAdminAccess();

  try {
    if (id === "new") return { success: true }; // Handled by create
    await writeClient
      .patch(id)
      .set({ images })
      .commit();
    revalidatePath(`/admin/inventory/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update product images:", error);
    return { success: false, error: "Failed to update product images" };
  }
}

export async function deleteProduct(id: string) {
  await requireAdminAccess();

  try {
    await writeClient.delete(id);
    revalidatePath("/admin/inventory");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete product:", error);
    return { success: false, error: "Failed to delete product" };
  }
}

export async function updateOrderStatus(id: string, newStatus: string) {
  await requireAdminAccess();

  try {
    await writeClient
      .patch(id)
      .set({ status: newStatus })
      .commit();
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${id}`);
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update order status:", error);
    return { success: false, error: "Failed to update order status" };
  }
}

export async function updateCustomerAddress(
  customerId: string,
  newAddress: {
    line1?: string;
    line2?: string;
    city?: string;
    postcode?: string;
    country?: string;
  }
) {
  await requireAdminAccess();

  try {
    await writeClient
      .patch(customerId)
      .set({
        "address.line1": newAddress.line1,
        "address.line2": newAddress.line2,
        "address.city": newAddress.city,
        "address.postcode": newAddress.postcode,
        "address.country": newAddress.country,
      })
      .commit();
    revalidatePath("/admin/orders"); // Will revalidate any order viewing this customer
    return { success: true };
  } catch (error) {
    console.error("Failed to update customer address:", error);
    return { success: false, error: "Failed to update customer address" };
  }
}

export async function uploadImage(formData: FormData) {
  await requireAdminAccess();

  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    const asset = await writeClient.assets.upload("image", file, {
      filename: file.name,
    });
    return { success: true, asset };
  } catch (error) {
    console.error("Upload failed:", error);
    return { success: false, error: "Upload failed" };
  }
}

/**
 * Form-oriented admin actions. These keep the Sanity write token on the
 * server and are the mutation boundary for the Clerk-authenticated dashboard.
 */
export async function createProductAndRedirect() {
  await requireAdminAccess();

  const id = crypto.randomUUID();
  await writeClient.create({
    _id: id,
    _type: "product",
    name: "Untitled Product",
    slug: { _type: "slug", current: `product-${id.slice(0, 8)}` },
    price: 1,
    stock: 0,
    featured: false,
    assemblyRequired: false,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/inventory");
  redirect(`/admin/inventory/${id}`);
}

export async function saveProductFromForm(id: string, formData: FormData) {
  await requireAdminAccess();
  assertDocumentId(id);

  const name = formText(formData, "name");
  const requestedSlug = formText(formData, "slug") || name;
  const slug = requestedSlug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const price = formNumber(formData, "price");
  const stock = Math.max(0, Math.trunc(formNumber(formData, "stock")));

  if (!name || !slug || price <= 0) {
    throw new Error("Name, slug, and a positive price are required");
  }

  await writeClient
    .patch(id)
    .set({
      name,
      slug: { _type: "slug", current: slug },
      description: formText(formData, "description"),
      price,
      stock,
      material: formText(formData, "material") || null,
      color: formText(formData, "color") || null,
      dimensions: formText(formData, "dimensions"),
      featured: formData.get("featured") === "on",
      assemblyRequired: formData.get("assemblyRequired") === "on",
    })
    .commit();

  revalidatePath("/admin");
  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/${id}`);
  revalidatePath(`/shop/products/${slug}`);
}

export async function deleteProductAndRedirect(id: string) {
  await requireAdminAccess();
  assertDocumentId(id);

  await writeClient.delete(id);
  revalidatePath("/admin");
  revalidatePath("/admin/inventory");
  redirect("/admin/inventory");
}

export async function uploadProductImage(id: string, formData: FormData) {
  await requireAdminAccess();
  assertDocumentId(id);

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return;
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files can be uploaded");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Images must be 8 MB or smaller");
  }

  const asset = await writeClient.assets.upload("image", file, {
    filename: file.name,
  });
  await writeClient
    .patch(id)
    .setIfMissing({ images: [] })
    .append("images", [
      {
        _key: crypto.randomUUID(),
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
      },
    ])
    .commit();

  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/${id}`);
}

export async function removeProductImage(id: string, imageKey: string) {
  await requireAdminAccess();
  assertDocumentId(id);
  if (!SANITY_ARRAY_KEY_PATTERN.test(imageKey)) {
    throw new Error("Invalid image key");
  }

  await writeClient.patch(id).unset([`images[_key == "${imageKey}"]`]).commit();
  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/${id}`);
}

export async function updateOrderStatusFromForm(
  id: string,
  formData: FormData,
) {
  assertDocumentId(id);
  const status = formText(formData, "status");
  const allowedStatuses = new Set([
    "inventory_issue",
    "paid",
    "shipped",
    "delivered",
    "cancelled",
  ]);
  if (!allowedStatuses.has(status)) throw new Error("Invalid order status");

  await updateOrderStatus(id, status);
}

export async function updateOrderAddressFromForm(
  id: string,
  formData: FormData,
) {
  await requireAdminAccess();
  assertDocumentId(id);

  await writeClient
    .patch(id)
    .set({
      "address.name": formText(formData, "name"),
      "address.line1": formText(formData, "line1"),
      "address.line2": formText(formData, "line2"),
      "address.city": formText(formData, "city"),
      "address.state": formText(formData, "state"),
      "address.postcode": formText(formData, "postcode"),
      "address.country": formText(formData, "country"),
      "address.phone": formText(formData, "phone"),
    })
    .commit();

  revalidatePath(`/admin/orders/${id}`);
}
