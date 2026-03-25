import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { checkSanityAccess } from "@/sanity/lib/auth";
import AdminLayoutUI from "./AdminLayoutUI";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Check if any of the user's emails are authorized in Sanity
  let isAuthorized = false;
  for (const email of user.emailAddresses) {
    if (await checkSanityAccess(email.emailAddress)) {
      isAuthorized = true;
      break;
    }
  }

  if (!isAuthorized) {
    redirect("/");
  }

  return <AdminLayoutUI>{children}</AdminLayoutUI>;
}
