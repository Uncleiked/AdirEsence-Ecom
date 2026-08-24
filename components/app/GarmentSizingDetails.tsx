import { Ruler } from "lucide-react";
import {
  formatGarmentSizing,
  normalizeGarmentSizing,
} from "@/lib/sizing/garment-sizing";
import { cn } from "@/lib/utils";

interface GarmentSizingDetailsProps {
  sizing: unknown;
  className?: string;
  compact?: boolean;
}

export function GarmentSizingDetails({
  sizing,
  className,
  compact = false,
}: GarmentSizingDetailsProps) {
  const normalizedSizing = normalizeGarmentSizing(sizing);
  if (!normalizedSizing) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-1.5 text-zinc-500 dark:text-zinc-400",
        compact ? "text-[10px] leading-4" : "text-xs leading-5",
        className,
      )}
    >
      <Ruler className={cn("mt-0.5 shrink-0", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
      <span>{formatGarmentSizing(normalizedSizing)}</span>
    </div>
  );
}
