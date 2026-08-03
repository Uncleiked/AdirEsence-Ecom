import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

const SANITY_ACCESS_API_VERSION = "v2025-07-11";
const SANITY_ADMIN_ROLES = new Set(["administrator", "editor", "developer"]);

interface SanityMembership {
  resourceType: string;
  resourceId: string;
  roleNames: string[];
}

interface SanityAccessUser {
  profile: {
    email: string;
  };
  memberships: SanityMembership[];
}

interface SanityAccessResponse {
  data: SanityAccessUser[];
}

export type AdminAccessResult =
  | { authorized: true; userId: string }
  | { authorized: false; reason: "unauthenticated" | "forbidden" };

/**
 * Checks whether an email belongs to a Sanity project member with a role that
 * can operate the custom admin dashboard.
 */
export async function checkSanityAccess(userEmail: string): Promise<boolean> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const token = process.env.SANITY_API_WRITE_TOKEN;

  if (!projectId || !token) {
    console.error("Admin authorization is missing Sanity API credentials");
    return false;
  }

  const normalizedEmail = userEmail.trim().toLowerCase();
  if (!normalizedEmail) return false;

  const searchParams = new URLSearchParams({
    email: normalizedEmail,
    includeImpliedRoles: "true",
    limit: "10",
  });

  try {
    const response = await fetch(
      `https://api.sanity.io/${SANITY_ACCESS_API_VERSION}/access/project/${projectId}/users?${searchParams}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error(
        `Sanity admin authorization request failed with status ${response.status}`,
      );
      return false;
    }

    const result = (await response.json()) as SanityAccessResponse;

    return result.data.some((sanityUser) => {
      if (sanityUser.profile.email.trim().toLowerCase() !== normalizedEmail) {
        return false;
      }

      return sanityUser.memberships.some(
        (membership) =>
          membership.resourceType === "project" &&
          membership.resourceId === projectId &&
          membership.roleNames.some((roleName) =>
            SANITY_ADMIN_ROLES.has(roleName.toLowerCase()),
          ),
      );
    });
  } catch (error) {
    console.error(
      "Sanity admin authorization request failed",
      error instanceof Error ? error.message : "Unknown error",
    );
    return false;
  }
}

/**
 * Resolves the current Clerk identity and applies the Sanity role policy.
 * This must run at every server-side admin entry point.
 */
export async function getAdminAccess(): Promise<AdminAccessResult> {
  const { userId } = await auth();

  if (!userId) {
    return { authorized: false, reason: "unauthenticated" };
  }

  const user = await currentUser();
  if (!user) {
    return { authorized: false, reason: "unauthenticated" };
  }

  for (const emailAddress of user.emailAddresses) {
    if (await checkSanityAccess(emailAddress.emailAddress)) {
      return { authorized: true, userId };
    }
  }

  return { authorized: false, reason: "forbidden" };
}

/**
 * Rejects unauthorized Server Action calls before any Sanity mutation runs.
 */
export async function requireAdminAccess(): Promise<{ userId: string }> {
  const access = await getAdminAccess();

  if (!access.authorized) {
    throw new Error(
      access.reason === "unauthenticated" ? "Unauthenticated" : "Forbidden",
    );
  }

  return { userId: access.userId };
}
