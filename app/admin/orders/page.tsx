import { Suspense } from "react";
import { ShoppingCart } from "lucide-react";
import { Table, TableBody } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderRow, OrderRowSkeleton, OrderTableHeader } from "@/components/admin";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import { OrderFilters } from "./OrderFilters";
import { OrderData } from "@/components/admin/OrderRow";

async function getOrders(statusFilter: string, searchFilter: string) {
  let condition = `_type == "order"`;
  if (statusFilter && statusFilter !== "all") {
    condition += ` && status == "${statusFilter}"`;
  }
  if (searchFilter) {
    condition += ` && (orderNumber match "*${searchFilter}*" || email match "*${searchFilter}*")`;
  }

  const query = groq`*[${condition}] | order(_createdAt desc) {
    _id,
    orderNumber,
    email,
    total,
    status,
    "createdAt": _createdAt,
    "itemCount": count(items)
  }`;

  return client.fetch(query);
}

export default async function OrdersPage(props: {
  searchParams: Promise<{ query?: string; status?: string }>;
}) {
  const searchParams = await props.searchParams;
  const statusFilter = searchParams.status || "all";
  const searchQuery = searchParams.query || "";

  const orders = await getOrders(statusFilter, searchQuery);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Orders
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
          Manage and track customer orders
        </p>
      </div>

      <OrderFilters initialQuery={searchQuery} initialStatus={statusFilter} />

      {/* Order List */}
      <Suspense fallback={
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <Table>
            <OrderTableHeader />
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <OrderRowSkeleton key={i} />
              ))}
            </TableBody>
          </Table>
        </div>
      }>
        {orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No orders found"
            description={
              searchQuery
                ? "Try adjusting your search terms."
                : statusFilter === "all"
                  ? "Orders will appear here when customers make purchases."
                  : `No ${statusFilter} orders at the moment.`
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <Table>
              <OrderTableHeader />
              <TableBody>
                {orders.map((order: OrderData) => (
                  <OrderRow key={order._id} order={order} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Suspense>
    </div>
  );
}
