import { CheckoutClient } from "./CheckoutClient";
import { sanityFetch } from "@/sanity/lib/live";
import { SITE_SETTINGS_QUERY } from "@/lib/sanity/queries/landing";

export const metadata = {
  title: "Checkout | Furniture Shop",
  description: "Complete your purchase",
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  let settings = null;
  try {
    const { data } = await sanityFetch({ query: SITE_SETTINGS_QUERY });
    settings = data;
  } catch (error) {
    console.error("Failed to fetch site settings in checkout page:", error);
  }

  return <CheckoutClient settings={settings} />;
}
