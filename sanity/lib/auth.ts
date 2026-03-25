import { clerkClient } from "@clerk/nextjs/server";

export async function checkSanityAccess(userEmail: string) {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const token = process.env.SANITY_API_WRITE_TOKEN;

  if (!projectId || !token) {
    console.error("Missing Sanity API credentials");
    return false;
  }

  try {
    // 1. Fetch project members
    const projectRes = await fetch(
      `https://api.sanity.io/v1/projects/${projectId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        next: {
          revalidate: 3600, // Cache for 1 hour to avoid rate limits
        },
      }
    );

    if (!projectRes.ok) {
      console.error("Failed to fetch project details", await projectRes.text());
      return false;
    }

    const projectData = await projectRes.json();
    const members = projectData.members || [];

    // 2. Filter non-robot members
    const humanMembers = members.filter((member: any) => !member.isRobot);

    // 3. Check each member's email
    for (const member of humanMembers) {
      const userRes = await fetch(
        `https://api.sanity.io/v1/users/${member.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          next: {
            revalidate: 3600,
          },
        }
      );

      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.email === userEmail) {
          return true; // Email matches an authorized Sanity member
        }
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking Sanity access:", error);
    return false;
  }
}
