import { redirect } from "next/navigation";

interface LegacySuccessPageProps {
  searchParams: Promise<{
    reference?: string;
    session_id?: string;
  }>;
}

export default async function LegacySuccessPage({
  searchParams,
}: LegacySuccessPageProps) {
  const parameters = await searchParams;
  const reference = parameters.reference ?? parameters.session_id;

  if (!reference) {
    redirect("/shop/declined?status=invalid_reference");
  }

  redirect(`/shop/success?reference=${encodeURIComponent(reference)}`);
}
