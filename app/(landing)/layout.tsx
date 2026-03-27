import { ReactNode } from "react";
import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { sanityFetch } from "@/sanity/lib/live";
import { SITE_SETTINGS_QUERY } from "@/lib/sanity/queries/landing";

// To ensure smooth scrolling when clicking hash links like /#about:
// we should apply scroll-smooth to the HTML element. This is typically done
// globally, but we can do it via a wrapper if needed.

export default async function LandingLayout({ children }: { children: ReactNode }) {
  // Try to fetch settings, gracefully falling back if they don't exist yet
  let settings = null;
  try {
    const { data } = await sanityFetch({ query: SITE_SETTINGS_QUERY });
    settings = data;
  } catch (error) {
    console.error("Failed to fetch site settings:", error);
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
       <LandingNavbar settings={settings} />
       <main className="flex-1 w-full flex flex-col items-center">
         {children}
       </main>
       <LandingFooter settings={settings} />
    </div>
  );
}
