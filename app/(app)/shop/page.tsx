// import { CategoryTiles } from "@/components/app/CategoryTiles";
// import { FeaturedCarousel } from "@/components/app/FeaturedCarousel";
// import { FeaturedCarouselSkeleton } from "@/components/app/FeaturedCarouselSkeleton";
// import { ProductSection } from "@/components/app/ProductSection";
// import { ScrollReveal } from "@/components/ui/scroll-reveal";
// import { InteractiveBackground } from "@/components/ui/interactive-background";
// // import { Button } from "@/components/ui/button";
// import { ALL_CATEGORIES_QUERY } from "@/lib/sanity/queries/categories";
// import { FEATURED_PRODUCTS_QUERY, FILTER_PRODUCTS_BY_NAME_QUERY, FILTER_PRODUCTS_BY_PRICE_ASC_QUERY, FILTER_PRODUCTS_BY_PRICE_DESC_QUERY, FILTER_PRODUCTS_BY_RELEVANCE_QUERY } from "@/lib/sanity/queries/products";
// import { sanityFetch } from "@/sanity/lib/live";
// import { Suspense } from "react";

// interface PageProps {
//   searchParams: Promise<{
//     q?: string;
//     category?: string;
//     color?: string;
//     material?: string;
//     minPrice?: string;
//     maxPrice?: string;
//     sort?: string;
//     inStock?: string;
//   }>;
// }


// export default async function HomePage({ searchParams }: PageProps) {
//   const params = await searchParams;

//   const searchQuery = params.q ?? "";
//   const categorySlug = params.category ?? "";
//   const color = params.color ?? "";
//   const material = params.material ?? "";
//   const minPrice = Number(params.minPrice) || 0;
//   const maxPrice = Number(params.maxPrice) || 0;
//   const sort = params.sort ?? "name";
//   const inStock = params.inStock === "true";

//   // Select query based on sort parameter
//   const getQuery = () => {
//     // If searching and sort is relevance, use relevance query
//     if (searchQuery && sort === "relevance") {
//       return FILTER_PRODUCTS_BY_RELEVANCE_QUERY;
//     }

//     switch (sort) {
//       case "price_asc":
//         return FILTER_PRODUCTS_BY_PRICE_ASC_QUERY;
//       case "price_desc":
//         return FILTER_PRODUCTS_BY_PRICE_DESC_QUERY;
//       case "relevance":
//         return FILTER_PRODUCTS_BY_RELEVANCE_QUERY;
//       default:
//         return FILTER_PRODUCTS_BY_NAME_QUERY;
//     }
//   };

// // Fetch products with filters (server-side via GROQ)
//   const { data: products } = await sanityFetch({
//     query: getQuery(),
//     params: {
//       searchQuery,
//       categorySlug,
//       color,
//       material,
//       minPrice,
//       maxPrice,
//       inStock,
//     },
//   });


//   // Fetch categories for filter sidebar
//   const { data: categories } = await sanityFetch({
//     query: ALL_CATEGORIES_QUERY,
//   });


//   // Fetch featured products for carousel
//   const { data: featuredProducts } = await sanityFetch({
//     query: FEATURED_PRODUCTS_QUERY,
//   });


//   return (
//     <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
//       {/* Featured Products Carousel */}
//       {featuredProducts.length > 0 && (
//         <ScrollReveal animation="fade-up">
//           <Suspense fallback={<FeaturedCarouselSkeleton />}>
//             <FeaturedCarousel products={featuredProducts} />
//           </Suspense>
//         </ScrollReveal>
//       )}

//          {/* Page Banner & Category Tiles - Starlight Background Container */}
//       <div className="relative border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black overflow-hidden">
//         {/* Starlight Background - Dark Mode Only */}
//         <div className="absolute inset-0 z-0 block">
//            <InteractiveBackground />
//         </div>

//         <div className="relative z-10">
//           <ScrollReveal animation="slide-right">
//             <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
//               <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
//                 Shop {categorySlug ? categorySlug : "All Products"}
//               </h1>
//               <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
//                 Premium furniture for your home
//               </p>
//             </div >

//             {/* Category Tiles - Full width */}
//             <div className="mt-6">
//               <CategoryTiles
//                 categories={categories}
//                 activeCategory={categorySlug || undefined}
//               />
//             </div>
//           </ScrollReveal>
//         </div>
//       </div>

//        {/* Product Section - Removed single ScrollReveal wrapper to inside ProductSection */}
//        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
//           <ProductSection
//             categories={categories}
//             products={products}
//             searchQuery={searchQuery}
//           />
//       </div>
//     </div>
//   );
// }

import { Suspense } from "react";
import { sanityFetch } from "@/sanity/lib/live";
import {
  FEATURED_PRODUCTS_QUERY,
  FILTER_PRODUCTS_BY_NAME_QUERY,
  FILTER_PRODUCTS_BY_PRICE_ASC_QUERY,
  FILTER_PRODUCTS_BY_PRICE_DESC_QUERY,
  FILTER_PRODUCTS_BY_RELEVANCE_QUERY,
} from "@/lib/sanity/queries/products";
import { ALL_CATEGORIES_QUERY } from "@/lib/sanity/queries/categories";
import { ProductSection } from "@/components/app/ProductSection";
import { CategoryTiles } from "@/components/app/CategoryTiles";
import { FeaturedCarousel } from "@/components/app/FeaturedCarousel";
import { FeaturedCarouselSkeleton } from "@/components/app/FeaturedCarouselSkeleton";
import { InteractiveBackground } from "@/components/ui/interactive-background";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    color?: string;
    material?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    inStock?: string;
  }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;

  const searchQuery = params.q ?? "";
  const categorySlug = params.category ?? "";
  const color = params.color ?? "";
  const material = params.material ?? "";
  const minPrice = Number(params.minPrice) || 0;
  const maxPrice = Number(params.maxPrice) || 0;
  const sort = params.sort ?? "name";
  const inStock = params.inStock === "true";

  // Select query based on sort parameter
  const getQuery = () => {
    // If searching and sort is relevance, use relevance query
    if (searchQuery && sort === "relevance") {
      return FILTER_PRODUCTS_BY_RELEVANCE_QUERY;
    }

    switch (sort) {
      case "price_asc":
        return FILTER_PRODUCTS_BY_PRICE_ASC_QUERY;
      case "price_desc":
        return FILTER_PRODUCTS_BY_PRICE_DESC_QUERY;
      case "relevance":
        return FILTER_PRODUCTS_BY_RELEVANCE_QUERY;
      default:
        return FILTER_PRODUCTS_BY_NAME_QUERY;
    }
  };

  // Fetch products with filters (server-side via GROQ)
  const { data: products } = await sanityFetch({
    query: getQuery(),
    params: {
      searchQuery,
      categorySlug,
      color,
      material,
      minPrice,
      maxPrice,
      inStock,
    },
  });

  // Fetch categories for filter sidebar
  const { data: categories } = await sanityFetch({
    query: ALL_CATEGORIES_QUERY,
  });

  // Fetch featured products for carousel
  const { data: featuredProducts } = await sanityFetch({
    query: FEATURED_PRODUCTS_QUERY,
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Featured Products Carousel */}
      {featuredProducts.length > 0 && (
        <Suspense fallback={<FeaturedCarouselSkeleton />}>
          <FeaturedCarousel products={featuredProducts} />
        </Suspense>
      )}

      {/* Page Banner */}
      <div className="relative border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
        {/* Starlight Background - Dark Mode Only */}
        <div className="absolute inset-0 z-0 block">
          <InteractiveBackground />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Shop {categorySlug ? categorySlug : "All Products"}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Premium furniture for your home
          </p>
        </div>

        {/* Category Tiles - Full width */}
        <div className="relative z-10 mt-6">
          <CategoryTiles
            categories={categories}
            activeCategory={categorySlug || undefined}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProductSection
          categories={categories}
          products={products}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}
