import { redirect } from "next/navigation";
import { getAdminAccess } from "@/sanity/lib/auth";

export default async function AdminAuthorizationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const access = await getAdminAccess();

  if (!access.authorized) {
    redirect("/");
  }

  return children;
}
