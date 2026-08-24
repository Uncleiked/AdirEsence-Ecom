import Link from "next/link";
import { Search, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getOrderStatus,
  ORDER_STATUS_TABS,
} from "@/lib/constants/orderStatus";
import {
  formatDate,
  formatOrderNumber,
  formatPrice,
} from "@/lib/utils";
import { getAllOrders } from "@/sanity/lib/admin-queries";

export const dynamic = "force-dynamic";

interface OrdersPageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const [{ q = "", status = "all" }, orders] = await Promise.all([
    searchParams,
    getAllOrders(),
  ]);
  const search = q.trim().toLowerCase();
  const visibleOrders = orders.filter((order) => {
    if (status !== "all" && order.status !== status) return false;
    if (!search) return true;
    return [order.orderNumber, order.email]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(search));
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Orders
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
          Manage and track customer orders
        </p>
      </div>

      <form className="flex w-full gap-2 sm:max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search by order number or email..."
            className="pl-9"
          />
        </div>
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {ORDER_STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            asChild
            size="sm"
            variant={status === tab.value ? "default" : "outline"}
          >
            <Link
              href={`/admin/orders?status=${tab.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            >
              {tab.label}
            </Link>
          </Button>
        ))}
      </div>

      {visibleOrders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
          <ShoppingCart className="mx-auto h-10 w-10 text-zinc-400" />
          <h2 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-100">
            No orders found
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Orders will appear here when customers complete checkout.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleOrders.map((order) => {
                const orderStatus = getOrderStatus(order.status);
                const StatusIcon = orderStatus.icon;
                return (
                  <TableRow key={order._id}>
                    <TableCell>
                      <Link
                        href={`/admin/orders/${order._id}`}
                        className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                      >
                        #{formatOrderNumber(order.orderNumber)}
                      </Link>
                      <p className="mt-1 max-w-44 truncate text-xs text-zinc-500 sm:hidden">
                        {order.email ?? "No email"}
                      </p>
                    </TableCell>
                    <TableCell className="hidden max-w-64 truncate sm:table-cell">
                      {order.email ?? "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {order.itemCount}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(order.total)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${orderStatus.color} gap-1`}>
                        <StatusIcon className="h-3 w-3" />
                        <span className="hidden sm:inline">{orderStatus.label}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatDate(order.createdAt, "long", "—")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
