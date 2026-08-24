import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CreditCard,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ORDER_STATUS_SANITY_LIST } from "@/lib/constants/orderStatus";
import { formatDate, formatPrice } from "@/lib/utils";
import { ProductSizingDetails } from "@/components/app/ProductSizingDetails";
import {
  updateOrderAddressFromForm,
  updateOrderStatusFromForm,
} from "@/sanity/lib/admin-actions";
import { getOrderById } from "@/sanity/lib/admin-queries";

export const dynamic = "force-dynamic";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const statusAction = updateOrderStatusFromForm.bind(null, order._id);
  const addressAction = updateOrderAddressFromForm.bind(null, order._id);
  const subtotal =
    (order.total ?? 0) - (order.shippingFee ?? 0) - (order.serviceCharge ?? 0);
  const addressFields: Array<{
    name: string;
    label: string;
    value: string | null | undefined;
  }> = [
    { name: "name", label: "Full name", value: order.address?.name },
    { name: "line1", label: "Address line 1", value: order.address?.line1 },
    { name: "line2", label: "Address line 2", value: order.address?.line2 },
    { name: "city", label: "City", value: order.address?.city },
    { name: "state", label: "State / region", value: order.address?.state },
    { name: "postcode", label: "Postcode", value: order.address?.postcode },
    { name: "country", label: "Country", value: order.address?.country },
    { name: "phone", label: "Phone", value: order.address?.phone },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Orders
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            Order {order.orderNumber ?? order._id}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {formatDate(order.createdAt, "datetime")}
          </p>
        </div>
        <form action={statusAction} className="flex items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={order.status ?? "paid"}
              className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {ORDER_STATUS_SANITY_LIST.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.title}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit">Update</Button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        <div className="space-y-6 lg:col-span-3">
          {order.status === "inventory_issue" && order.inventoryIssue && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <h2 className="font-semibold">Paid order needs attention</h2>
                  <p className="mt-1 text-sm">{order.inventoryIssue.reason}</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {order.inventoryIssue.items?.map((item) => (
                      <li key={item._key}>
                        {item.name}: requested {item.requested}, available {item.available}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:px-6 sm:py-4">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Items ({order.items?.length ?? 0})
              </h2>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {order.items?.map((item) => (
                <div key={item._key} className="flex gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800 sm:h-20 sm:w-20">
                    {item.product?.imageUrl ? (
                      <Image
                        src={item.product.imageUrl}
                        alt={item.product.name ?? "Product"}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                        {item.product?.name ?? "Unknown Product"}
                      </span>
                      {item.product?.slug && (
                        <Link href={`/shop/products/${item.product.slug}`} target="_blank">
                          <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                        </Link>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                      Qty: {item.quantity ?? 0} × {formatPrice(item.priceAtPurchase)}
                    </p>
                    {(item.sizing || item.alphaSize) && (
                      <ProductSizingDetails
                        sizing={item.sizing}
                        alphaSize={item.alphaSize}
                        className="mt-2"
                      />
                    )}
                  </div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {formatPrice((item.priceAtPurchase ?? 0) * (item.quantity ?? 0))}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Order Summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Shipping</span>
                <span>{formatPrice(order.shippingFee)}</span>
              </div>
              {(order.serviceCharge ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Service charge</span>
                  <span>{formatPrice(order.serviceCharge)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-zinc-200 pt-3 text-base font-semibold dark:border-zinc-800">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-zinc-400" />
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Customer</h2>
            </div>
            <p className="mt-4 break-all text-sm">{order.email ?? "No email"}</p>
            {order.paymentId && (
              <p className="mt-2 break-all text-xs text-zinc-500">
                {order.paymentProvider === "paystack" ? "Paystack" : "Payment"}: {order.paymentId}
              </p>
            )}
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-zinc-400" />
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Shipping Address
              </h2>
            </div>
            <form action={addressAction} className="mt-4 space-y-3">
              {addressFields.map((field) => (
                <div key={field.name} className="space-y-1">
                  <Label htmlFor={field.name}>{field.label}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    defaultValue={field.value ?? ""}
                  />
                </div>
              ))}
              <Button type="submit" className="w-full">Save address</Button>
            </form>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Advanced Editing</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Sanity Studio uses Sanity membership authentication separately from Clerk.
            </p>
            <Link
              href={`/studio/structure/order;${order._id}`}
              target="_blank"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-zinc-900 dark:text-zinc-100"
            >
              Open Sanity Studio
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
