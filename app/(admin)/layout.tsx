import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ShieldAlert } from "lucide-react";
import { getAdminAccess } from "@/sanity/lib/auth";
import { Button } from "@/components/ui/button";

export default async function AdminAuthorizationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const access = await getAdminAccess();

  if (!access.authorized) {
    if (access.reason === "unauthenticated") {
      const { redirectToSignIn } = await auth();
      return redirectToSignIn({ returnBackUrl: "/admin" });
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
        <section className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Admin access required
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            You are signed in, but this email is not an administrator, editor,
            or developer on the connected Sanity project. Add this email as a
            Sanity project member, then try again.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/">Back to store</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin" prefetch={false}>
                Try again
              </Link>
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return children;
}
