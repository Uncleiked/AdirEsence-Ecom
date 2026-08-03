import { redirect } from "next/navigation";
import { CheckoutSuccess } from "./CheckoutSuccess";
import { getCheckoutSession } from "@/lib/actions/checkout";

export const metadata = {
  title: "Order Confirmed | AdirEssence",
  description: "Your order has been placed successfully",
};

export const dynamic = "force-dynamic";

interface SuccessPageProps {
  searchParams: Promise<{ reference?: string }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const { reference } = await searchParams;

  if (!reference) {
    redirect("/shop/declined?status=invalid_reference");
  }

  const result = await getCheckoutSession(reference);
  if (!result.success || !result.session) {
    redirect(
      `/shop/declined?status=order_not_found&reference=${encodeURIComponent(reference)}`,
    );
  }

  return <CheckoutSuccess session={result.session} />;
}
