interface CheckoutBaseUrlOptions {
  configuredUrl?: string;
  requestOrigin?: string | null;
  forwardedHost?: string | null;
  forwardedProto?: string | null;
  vercelUrl?: string;
}

function normalizeOrigin(value: string | null | undefined): string | null {
  const candidate = value?.trim();
  if (!candidate || candidate === "null") return null;

  try {
    const url = new URL(
      candidate.includes("://") ? candidate : `https://${candidate}`,
    );

    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Resolves the public origin that Paystack must return the buyer to.
 *
 * The initiating request origin intentionally takes precedence over VERCEL_URL:
 * VERCEL_URL is the deployment URL, which can differ from the production custom
 * domain and therefore lose the buyer's Clerk session on the return trip.
 */
export function resolveCheckoutBaseUrl({
  configuredUrl,
  requestOrigin,
  forwardedHost,
  forwardedProto,
  vercelUrl,
}: CheckoutBaseUrlOptions): string {
  const configuredOrigin = normalizeOrigin(configuredUrl);
  if (configuredOrigin) return configuredOrigin;

  const browserOrigin = normalizeOrigin(requestOrigin);
  if (browserOrigin) return browserOrigin;

  const forwardedHostname = forwardedHost?.split(",")[0]?.trim();
  const forwardedProtocol =
    forwardedProto?.split(",")[0]?.trim().replace(/:$/, "") || "https";
  const forwardedOrigin = normalizeOrigin(
    forwardedHostname
      ? `${forwardedProtocol}://${forwardedHostname}`
      : undefined,
  );
  if (forwardedOrigin) return forwardedOrigin;

  const deploymentOrigin = normalizeOrigin(vercelUrl);
  if (deploymentOrigin) return deploymentOrigin;

  return "http://localhost:3000";
}
