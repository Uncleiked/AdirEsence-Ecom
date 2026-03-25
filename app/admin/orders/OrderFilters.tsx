"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminSearch, useDebouncedValue } from "@/components/admin";
import { ORDER_STATUS_TABS } from "@/lib/constants/orderStatus";

interface OrderFiltersProps {
  initialQuery?: string;
  initialStatus?: string;
}

export function OrderFilters({ initialQuery = "", initialStatus = "all" }: OrderFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);
  const debouncedQuery = useDebouncedValue(query, 500);

  useEffect(() => {
    // If the URL changes externally, update our local state
    const currentQuery = searchParams.get("query") || "";
    const currentStatus = searchParams.get("status") || "all";
    if (currentQuery !== query && query === initialQuery) {
      setQuery(currentQuery);
    }
    if (currentStatus !== status && status === initialStatus) {
      setStatus(currentStatus);
    }
  }, [searchParams]);

  useEffect(() => {
    // When filters change, update the URL
    const params = new URLSearchParams(searchParams);
    if (debouncedQuery) {
      params.set("query", debouncedQuery);
    } else {
      params.delete("query");
    }

    if (status !== "all") {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    
    router.replace(`/admin/orders?${params.toString()}`);
  }, [debouncedQuery, status]);

  return (
    <div className="flex flex-col gap-4">
      <AdminSearch
        placeholder="Search by order # or email..."
        value={query}
        onChange={setQuery}
        className="w-full sm:max-w-xs"
      />
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <Tabs value={status} onValueChange={setStatus}>
          <TabsList className="w-max">
            {ORDER_STATUS_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-xs sm:text-sm"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
