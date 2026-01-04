import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { buttonVariants } from "./button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = "md",
  className,
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: "py-8",
      icon: "h-8 w-8",
      title: "text-base",
      description: "text-xs",
    },
    md: {
      container: "py-12",
      icon: "h-12 w-12",
      title: "text-lg",
      description: "text-sm",
    },
    lg: {
      container: "py-16",
      icon: "h-16 w-16",
      title: "text-xl",
      description: "text-base",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        classes.container,
        className
      )}
    >
      <Icon
        className={cn(
          "text-zinc-300 dark:text-zinc-600",
          classes.icon
        )}
      />
      <h3
        className={cn(
          "mt-4 font-medium text-zinc-900 dark:text-zinc-100",
          classes.title
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "mt-1 text-zinc-500 dark:text-zinc-400",
          classes.description
        )}
      >
        {description}
      </p>
      {action && (
        <Link
          href={action.href}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "mt-6"
          )}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
