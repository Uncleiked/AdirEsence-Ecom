"use server";

import { writeClient } from "./client";
import { revalidatePath } from "next/cache";
import { requireAdminAccess } from "./auth";

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
