import Link from "next/link";
import { FacebookIcon, InstagramIcon, TwitterIcon, YoutubeIcon, PinIcon } from "lucide-react";
import type { SITE_SETTINGS_QUERYResult } from "@/sanity.types";

const defaultFooterLinks = [
  { title: "Terms & Conditions", url: "/terms" },
  { title: "Privacy Policy", url: "/privacy" },
];

export function LandingFooter({
  settings,
}: {
  settings: SITE_SETTINGS_QUERYResult;
}) {
  const siteName = settings?.siteName || "AdirEssence";
  const links =
    settings?.footerLinks?.flatMap((link) =>
      link.title && link.url ? [{ title: link.title, url: link.url }] : [],
    ) || defaultFooterLinks;
  const social = settings?.socialLinks;

  return (
    <footer className="bg-zinc-50 border-t border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link
              href="/"
              data-text={siteName}
              className="text-fill-hover text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 uppercase px-1 py-0.5 rounded"
            >
              {siteName}
            </Link>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Culture Fusion. Wear Your Culture. Premium fashion to express your true self.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-1">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { title: "Home", url: "/" },
                { title: "About", url: "/#about" },
                { title: "Categories", url: "/#categories" },
                { title: "Shop", url: "/shop" },
              ].map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.url}
                    data-text={link.title}
                    className="text-fill-hover text-sm text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Admin */}
          <div className="md:col-span-1">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Admin</h3>
            <ul className="space-y-3">
              {[
                { title: "Admin Dashboard", url: "/admin" },
                { title: "Sanity Studio", url: "/studio" },
              ].map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.url}
                    prefetch={link.url === "/admin" ? false : undefined}
                    data-text={link.title}
                    className="text-fill-hover text-sm text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="md:col-span-1">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Legal</h3>
            <ul className="space-y-3">
              {links.map((link) => (
                <li key={`${link.title}-${link.url}`}>
                  <Link
                    href={link.url}
                    data-text={link.title}
                    className="text-fill-hover text-sm text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <div className="flex space-x-5">
            {social?.instagram && (
              <a href={social.instagram} target="_blank" rel="noopener noreferrer"
                className="water-hover p-1.5 rounded-full text-zinc-500 transition-colors">
                <InstagramIcon className="w-5 h-5" />
              </a>
            )}
            {social?.facebook && (
              <a href={social.facebook} target="_blank" rel="noopener noreferrer"
                className="water-hover p-1.5 rounded-full text-zinc-500 transition-colors">
                <FacebookIcon className="w-5 h-5" />
              </a>
            )}
            {social?.x && (
              <a href={social.x} target="_blank" rel="noopener noreferrer"
                className="water-hover p-1.5 rounded-full text-zinc-500 transition-colors">
                <TwitterIcon className="w-5 h-5" />
              </a>
            )}
            {social?.youtube && (
              <a href={social.youtube} target="_blank" rel="noopener noreferrer"
                className="water-hover p-1.5 rounded-full text-zinc-500 transition-colors">
                <YoutubeIcon className="w-5 h-5" />
              </a>
            )}
            {social?.pinterest && (
              <a href={social.pinterest} target="_blank" rel="noopener noreferrer"
                className="water-hover p-1.5 rounded-full text-zinc-500 transition-colors">
                <PinIcon className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
