"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProduct } from "@/sanity/lib/admin-actions";

interface DeleteButtonProps {
  id: string;
  redirectTo?: string;
}

export function DeleteButton({
  id,
  redirectTo = "/admin/inventory",
}: DeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Delete this product permanently? This cannot be undone.",
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const result = await deleteProduct(id);
      if (result.success) {
        router.push(redirectTo);
      } else {
        alert("Failed to delete product.");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Delete failed:", error);
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      className="gap-1.5"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      Delete
    </Button>
  );
}
