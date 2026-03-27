"use client";

import Link from "next/link";
import Image from "next/image";
import { Grid2x2, ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";

interface Category {
  _id: string;
  title?: string | null;
  slug?: string | null;
  image?: { asset?: { url?: string | null } | null } | null;
}

interface LandingCategoryCarouselProps {
  categories: Category[];
}

export function LandingCategoryCarousel({ categories }: LandingCategoryCarouselProps) {
  // Ripple effect handler
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const handleMouseEnter = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const me = e as MouseEvent;
      const x = ((me.clientX - rect.left) / rect.width) * 100;
      const y = ((me.clientY - rect.top) / rect.height) * 100;
      target.style.setProperty("--mx", `${x}%`);
      target.style.setProperty("--my", `${y}%`);
    };

    const waterEls = section.querySelectorAll(".water-hover");
    waterEls.forEach((el) => {
      el.addEventListener("mouseenter", handleMouseEnter as EventListener);
    });

    return () => {
      waterEls.forEach((el) => {
        el.removeEventListener("mouseenter", handleMouseEnter as EventListener);
      });
    };
  }, [categories]);

  if (!categories || categories.length === 0) return null;

  // Triple the list for a seamless infinite marquee
  const tileList = [...categories, ...categories, ...categories];

  return (
    <section
      ref={sectionRef}
      id="categories"
      className="relative w-full py-20 bg-white dark:bg-zinc-950 overflow-hidden"
    >
      {/* Section Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-orange-500 font-semibold mb-2">
              Browse
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight leading-tight">
              Shop by Category
            </h2>
            <div className="w-14 h-1.5 bg-orange-500 rounded-full mt-4" />
          </div>
          <Link
            href="/shop"
            className="water-hover inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-semibold text-sm transition-all duration-300 hover:border-orange-500 self-start sm:self-auto"
          >
            Explore All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Marquee Carousel */}
      <div className="relative w-full overflow-hidden">
        {/* Fade masks */}
        <div className="absolute left-0 top-0 z-10 h-full w-20 bg-linear-to-r from-white to-transparent dark:from-zinc-950 pointer-events-none" />
        <div className="absolute right-0 top-0 z-10 h-full w-20 bg-linear-to-l from-white to-transparent dark:from-zinc-950 pointer-events-none" />

        {/* Scrolling row */}
        <div className="flex w-max animate-marquee gap-4 hover:paused mx-auto px-4">
          {/* "All Products" tile */}
          <Link
            href="/shop"
            className="water-hover group relative shrink-0 overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="relative h-40 w-60 sm:h-56 sm:w-80">
              <div className="absolute inset-0 bg-linear-to-br from-zinc-800 to-zinc-900" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Grid2x2 className="h-12 w-12 text-white/60 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <span className="text-base font-bold text-white drop-shadow-md tracking-wide">
                  All Products
                </span>
              </div>
            </div>
          </Link>

          {/* Category tiles */}
          {tileList.map((category, index) => {
            const key = `${category._id}-${index}`;
            const imageUrl = category.image?.asset?.url;

            return (
              <Link
                key={key}
                href={`/shop?category=${category.slug}`}
                className="water-hover group relative shrink-0 overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="relative h-40 w-60 sm:h-56 sm:w-80">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={category.title ?? "Category"}
                      fill
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-110"
                      quality={100}
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-orange-400 to-orange-600" />
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/80" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <span className="text-base font-bold text-white drop-shadow-md tracking-wide">
                      {category.title}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
