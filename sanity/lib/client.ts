import { createClient } from "next-sanity";
import dns from "node:dns";

// Force IPv4 for DNS resolution to avoid EAI_AGAIN errors on some networks/Node versions
// This is a common workaround when Node defaults to IPv6 but the network/ISP has partial IPv6 support
try {
  dns.setDefaultResultOrder("ipv4first");
} catch (error) {
  // Ignore error if this method doesn't exist (older Node versions) or fails
  console.warn("Could not set default DNS result order:", error);
}

import { apiVersion, dataset, projectId } from "../env";

// Read-only client (for fetching data)
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Set to false if statically generating pages, using ISR or tag-based revalidation
  perspective: "published",
});

// Write client (for mutations - used in webhooks/server actions)
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});
