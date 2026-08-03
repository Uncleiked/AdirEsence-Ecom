import Link from "next/link";
import { AlertCircle, ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Payment Not Completed | AdirEssence",
  description: "Your payment was not completed",
};

interface DeclinedPageProps {
  searchParams: Promise<{ reference?: string; status?: string }>;
}

const STATUS_MESSAGES: Record<string, { title: string; description: string }> = {
  abandoned: {
    title: "Payment cancelled",
    description: "The payment was not completed. Your cart is still available.",
  },
  failed: {
    title: "Payment declined",
    description: "Paystack could not complete the payment. No order was fulfilled.",
  },
  reversed: {
    title: "Payment reversed",
    description: "The transaction was reversed and the order was not fulfilled.",
  },
  pending: {
    title: "Payment still pending",
    description: "Paystack is still processing this payment. Please check again shortly.",
  },
  ongoing: {
    title: "Payment still in progress",
    description: "The payment has not completed yet. You can return and try again.",
  },
  processing: {
    title: "Payment still processing",
    description: "Paystack is still processing this payment. Please check again shortly.",
  },
  verification_failed: {
    title: "We could not verify the payment",
    description: "No duplicate charge was made. Please check your orders or try again shortly.",
  },
  order_not_found: {
    title: "Order is still being recorded",
    description: "Please check your orders again in a moment.",
  },
  invalid_reference: {
    title: "Invalid payment reference",
    description: "We could not match this return link to your signed-in account.",
  },
};

export default async function DeclinedPage({ searchParams }: DeclinedPageProps) {
  const { reference, status = "failed" } = await searchParams;
  const message = STATUS_MESSAGES[status] ?? STATUS_MESSAGES.failed;

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
      <h1 className="mt-5 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
        {message.title}
      </h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        {message.description}
      </p>
      {reference && (
        <p className="mt-4 break-all text-xs text-zinc-500">
          Reference: {reference}
        </p>
      )}
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/shop/checkout">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to checkout
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/shop/orders">
            <Package className="mr-2 h-4 w-4" />
            Check my orders
          </Link>
        </Button>
      </div>
    </div>
  );
}
