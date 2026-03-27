"use client";

import Link from "next/link";
import Image from "next/image";
import { Grid2x2 } from "lucide-react";
import type { ALL_CATEGORIES_QUERYResult } from "@/sanity.types";

interface CategoryTilesProps {
  categories: ALL_CATEGORIES_QUERYResult;
  activeCategory?: string;
}

export function CategoryTiles({
  categories,
  activeCategory,
}: CategoryTilesProps) {
  // Duplicate categories to create seamless loop
  const tileList = [...categories, ...categories, ...categories]; // Triple for safety on wide screens

  return (
    <div className="relative w-full overflow-hidden py-8">
      {/* Mask for fade effect on edges */}
      <div className="absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-zinc-50 to-transparent dark:from-zinc-900" />
      <div className="absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-zinc-50 to-transparent dark:from-zinc-900" />

      {/* Marquee Container */}
      <div className="flex w-max animate-marquee gap-4 hover:[animation-play-state:paused] mx-auto">
        {/* All Products tile */}
        <Link
          href="/shop"
          className={`group relative flex-shrink-0 overflow-hidden rounded-xl transition-all duration-300 ${
            !activeCategory
              ? "ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-zinc-900"
              : "hover:ring-2 hover:ring-zinc-300 hover:ring-offset-2 dark:hover:ring-zinc-600 dark:hover:ring-offset-zinc-900"
          }`}
        >
          <div className="relative h-32 w-56 sm:h-56 sm:w-80">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 dark:from-zinc-700 dark:to-zinc-800" />

            {/* Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Grid2x2 className="h-12 w-12 text-white/60 transition-transform duration-300 group-hover:scale-110" />
            </div>

            {/* Dark overlay for text */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Category name */}
            <div className="absolute inset-x-0 bottom-0 p-4">
              <span className="text-base font-semibold text-white drop-shadow-md">
                All Products
              </span>
            </div>
          </div>
        </Link>

        {/* Category tiles */}
        {tileList.map((category, index) => {
          // Use index in key to allow duplicates
          const key = `${category._id}-${index}`;
          const isActive = activeCategory === category.slug;
          const imageUrl = category.image?.asset?.url;

          return (
            <Link
              key={key}
              href={`/shop?category=${category.slug}`}
              className={`group relative flex-shrink-0 overflow-hidden rounded-xl transition-all duration-300 ${
                isActive
                  ? "ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-zinc-900"
                  : "hover:ring-2 hover:ring-zinc-300 hover:ring-offset-2 dark:hover:ring-zinc-600 dark:hover:ring-offset-zinc-900"
              }`}
            >
              <div className="relative h-32 w-56 sm:h-56 sm:w-80">
                {/* Background image or gradient fallback */}
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={category.title ?? "Category"}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600" />
                )}

                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/80" />

                {/* Category name */}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <span className="text-base font-semibold text-white drop-shadow-md">
                    {category.title}
                  </span>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <span className="flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                    </span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
