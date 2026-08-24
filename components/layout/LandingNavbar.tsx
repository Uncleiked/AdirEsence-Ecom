"use client";

import Link from "next/link";
import { useState } from "react";
import {
  MenuIcon,
  PackageIcon,
  ShoppingBagIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import type { SITE_SETTINGS_QUERYResult } from "@/sanity.types";

export function LandingNavbar({
  settings,
}: {
  settings: SITE_SETTINGS_QUERYResult;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const siteName = settings?.siteName || "AdirEssence";

  const navLinks = [
    { title: "Home", href: "/" },
    { title: "About", href: "/#about" },
    { title: "Categories", href: "/#categories" },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80 transition-all duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            {/* Logo */}
            <div className="shrink-0 flex items-center">
              <Link
                href="/"
                data-text={siteName}
                className="text-fill-hover text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 uppercase px-2 py-1 rounded-md"
              >
                {siteName}
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {navLinks.map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  data-text={link.title}
                  className="text-fill-hover text-sm font-medium text-zinc-600 dark:text-zinc-400 transition-colors px-3 py-1.5 rounded-md"
                >
                  {link.title}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <SignedIn>
                <Link
                  href="/shop/orders"
                  className="text-fill-hover flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors dark:text-zinc-400"
                >
                  <PackageIcon className="h-4 w-4" />
                  My Orders
                </Link>
                <UserButton
                  afterSwitchSessionUrl="/"
                  appearance={{ elements: { avatarBox: "h-9 w-9" } }}
                />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="text-fill-hover flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors dark:text-zinc-400"
                  >
                    <UserIcon className="h-4 w-4" />
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>
              <Link
                href={settings?.headerCtaLink || "/shop"}
                className="water-hover flex items-center space-x-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300"
              >
                <span>{settings?.headerCtaText || "Shop"}</span>
                <ShoppingBagIcon className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center gap-1 md:hidden">
              <SignedIn>
                <UserButton
                  afterSwitchSessionUrl="/"
                  appearance={{ elements: { avatarBox: "h-9 w-9" } }}
                />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="rounded-md p-2 text-zinc-600 dark:text-zinc-400"
                    aria-label="Sign in"
                  >
                    <UserIcon className="h-6 w-6" />
                  </button>
                </SignInButton>
              </SignedOut>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="text-zinc-600 dark:text-zinc-400 p-2 rounded-md focus:outline-none"
                aria-label="Toggle navigation"
              >
                {isOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation – Full-page overlay (OUTSIDE the sticky nav) */}
      <div
        className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-black transition-all duration-300 md:hidden ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Close button pinned top-right */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-5 right-5 p-2 text-zinc-600 dark:text-zinc-400 rounded-md z-10"
          aria-label="Close navigation"
        >
          <XIcon className="h-7 w-7" />
        </button>

        <nav className="flex flex-col items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              onClick={() => setIsOpen(false)}
              data-text={link.title}
              className="text-fill-hover text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-wide transition-colors"
            >
              {link.title}
            </Link>
          ))}
          <Link
            href={settings?.headerCtaLink || "/shop"}
            onClick={() => setIsOpen(false)}
            className="water-hover flex items-center gap-2 mt-4 px-10 py-4 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black text-xl font-semibold transition-all duration-300"
          >
            <span>{settings?.headerCtaText || "Shop Now"}</span>
            <ShoppingBagIcon className="w-5 h-5" />
          </Link>
        </nav>
      </div>
    </>
  );
}
