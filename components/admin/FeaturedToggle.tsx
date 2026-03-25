"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleProductFeatured } from "@/sanity/lib/admin-actions";

export function FeaturedToggle({ id, initialFeatured }: { id: string, initialFeatured: boolean }) {
  const [featured, setFeatured] = useState(initialFeatured);
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async () => {
    setIsPending(true);
    const newValue = !featured;
    setFeatured(newValue); // Optimistic UI update
    
    const result = await toggleProductFeatured(id, newValue);
    if (!result.success) {
      setFeatured(featured); // Revert if failed
    }
    setIsPending(false);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={handleToggle}
      disabled={isPending}
      title={featured ? "Remove from featured" : "Add to featured"}
    >
      <Star
        className={cn(
          "h-4 w-4 transition-colors",
          featured
            ? "fill-amber-400 text-amber-400"
            : "text-zinc-300 dark:text-zinc-600",
        )}
      />
    </Button>
  );
}
