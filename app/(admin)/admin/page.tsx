import Link from "next/link";
import { AlertTriangle, Package, Plus, ShoppingCart } from "lucide-react";
import { AIInsightsCard } from "@/components/admin/AIInsightsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatPrice } from "@/lib/utils";
import { getOrderStatus } from "@/lib/constants/orderStatus";
import { createProductAndRedirect } from "@/sanity/lib/admin-actions";
import { getAdminDashboardData } from "@/sanity/lib/admin-queries";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const data = await getAdminDashboardData();
  const statCards = [
    {
      title: "Total Products",
      value: data.stats.totalProducts,
      icon: Package,
      href: "/admin/inventory",
    },
    {
      title: "Total Orders",
      value: data.stats.totalOrders,
      icon: ShoppingCart,
      href: "/admin/orders",
    },
    {
      title: "Low Stock Items",
      value: data.stats.lowStockProducts,
      icon: AlertTriangle,
      href: "/admin/inventory?filter=low-stock",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
            Overview of your store
          </p>
        </div>
        <form action={createProductAndRedirect}>
          <Button type="submit" className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            New Product
          </Button>
        </form>
      </div>

      <AIInsightsCard />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {card.title}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                    {card.value}
                  </p>
                </div>
                <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800">
                  <Icon className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Recent Orders
            </h2>
            <Link href="/admin/orders" className="text-sm text-zinc-500 hover:text-zinc-900">
              View all
            </Link>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {data.recentOrders.length === 0 ? (
              <p className="p-5 text-sm text-zinc-500">No orders yet.</p>
            ) : (
              data.recentOrders.map((order) => {
                const status = getOrderStatus(order.status);
                return (
                  <Link
                    key={order._id}
                    href={`/admin/orders/${order._id}`}
                    className="flex items-center justify-between gap-4 p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                        {order.orderNumber ?? "Order"}
                      </p>
                      <p className="mt-1 truncate text-xs text-zinc-500">
                        {order.email ?? "No email"} · {formatDate(order.createdAt, "short")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {formatPrice(order.total ?? 0)}
                      </p>
                      <Badge className={`${status.color} mt-1 text-[10px]`}>
                        {status.label}
                      </Badge>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Low Stock
            </h2>
            <Link
              href="/admin/inventory?filter=low-stock"
              className="text-sm text-zinc-500 hover:text-zinc-900"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {data.lowStock.length === 0 ? (
              <p className="p-5 text-sm text-zinc-500">Stock levels look good.</p>
            ) : (
              data.lowStock.map((product) => (
                <Link
                  key={product._id}
                  href={`/admin/inventory/${product._id}`}
                  className="flex items-center justify-between gap-4 p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                    {product.name ?? "Untitled Product"}
                  </span>
                  <Badge variant={(product.stock ?? 0) <= 0 ? "destructive" : "secondary"}>
                    {product.stock ?? 0} left
                  </Badge>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
