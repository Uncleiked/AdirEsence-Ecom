"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminSearch, useDebouncedValue } from "@/components/admin";

export function InventorySearch({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebouncedValue(query, 500);

  useEffect(() => {
    // If the URL changes externally, update our local state
    const currentUrlQuery = searchParams.get("query") || "";
    if (currentUrlQuery !== query && query === initialQuery) {
      setQuery(currentUrlQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    // When the debounced query changes, update the URL
    const params = new URLSearchParams(searchParams);
    if (debouncedQuery) {
      params.set("query", debouncedQuery);
    } else {
      params.delete("query");
    }
    
    router.replace(`/admin/inventory?${params.toString()}`);
  }, [debouncedQuery]);

  return (
    <AdminSearch
      value={query}
      onChange={setQuery}
      placeholder="Search products by name..."
      className="max-w-md"
    />
  );
}
