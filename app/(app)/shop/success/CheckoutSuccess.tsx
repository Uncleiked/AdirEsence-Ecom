"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useCartActions } from "@/lib/store/cart-store-provider";

interface CheckoutSuccessProps {
  session: {
    id: string;
    orderNumber?: string | null;
    orderStatus?: string | null;
    customerEmail?: string | null;
    customerName?: string | null;
    amountTotal?: number | null;
    paymentStatus: string;
    shippingAddress?: {
      line1?: string | null;
      line2?: string | null;
      city?: string | null;
      state?: string | null;
      postcode?: string | null;
      country?: string | null;
    } | null;
    lineItems?: {
      name?: string | null;
      quantity?: number | null;
      amount: number;
    }[];
  };
}

export function CheckoutSuccess({ session }: CheckoutSuccessProps) {
  const { clearCart } = useCartActions();
  const hasInventoryIssue = session.orderStatus === "inventory_issue";

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  const address = session.shippingAddress;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Order confirmed
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Order <span className="font-semibold">{session.orderNumber}</span> has
          been recorded. A confirmation will be sent to{" "}
          <span className="font-medium">{session.customerEmail}</span>.
        </p>
      </div>

      {hasInventoryIssue && (
        <div className="mt-8 flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Your payment succeeded, but this order needs a manual inventory
            review. The store team can see it and no incorrect stock deduction
            was made.
          </p>
        </div>
      )}

      <div className="mt-10 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Order details
            </h2>
            <span className="text-sm font-medium text-zinc-500">
              {session.orderNumber}
            </span>
          </div>
        </div>

        <div className="px-6 py-4">
          {session.lineItems && session.lineItems.length > 0 && (
            <div className="space-y-3">
              {session.lineItems.map((item) => (
                <div
                  key={`${item.name}-${item.quantity}-${item.amount}`}
                  className="flex justify-between text-sm"
                >
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {formatPrice(item.amount / 100)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <div className="flex justify-between text-base font-semibold">
              <span className="text-zinc-900 dark:text-zinc-100">Total</span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {formatPrice((session.amountTotal ?? 0) / 100)}
              </span>
            </div>
          </div>
        </div>

        {address && (
          <div className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Shipping to
            </h3>
            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {session.customerName && <p>{session.customerName}</p>}
              {address.line1 && <p>{address.line1}</p>}
              {address.line2 && <p>{address.line2}</p>}
              <p>
                {[address.city, address.state, address.postcode]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {address.country && <p>{address.country}</p>}
            </div>
          </div>
        )}

        <div className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-zinc-400" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Payment status:{" "}
              <span className="font-medium capitalize text-green-600">
                {session.paymentStatus}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild variant="outline">
          <Link href={`/shop/orders/${session.id}`}>
            View this order
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild>
          <Link href="/shop/orders">View all orders</Link>
        </Button>
      </div>
    </div>
  );
}
