import { Shirt } from "lucide-react";
import { GarmentSizingDetails } from "@/components/app/GarmentSizingDetails";
import { ALPHA_SIZES, type AlphaSize } from "@/lib/sizing/garment-sizing";
import { cn } from "@/lib/utils";

interface ProductSizingDetailsProps {
  sizing?: unknown;
  alphaSize?: unknown;
  className?: string;
  compact?: boolean;
}

export function ProductSizingDetails({
  sizing,
  alphaSize,
  className,
  compact = false,
}: ProductSizingDetailsProps) {
  if (
    typeof alphaSize === "string" &&
    ALPHA_SIZES.includes(alphaSize as AlphaSize)
  ) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-300",
          compact ? "text-[10px] leading-4" : "text-xs leading-5",
          className,
        )}
      >
        <Shirt className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
        <span>Size {alphaSize}</span>
      </div>
    );
  }

  return (
    <GarmentSizingDetails
      sizing={sizing}
      className={className}
      compact={compact}
    />
  );
}
