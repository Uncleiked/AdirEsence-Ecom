# Admin authentication and Sanity data boundary

## Status

Accepted — 2026-08-24

## Context

The storefront has a custom administration interface at `/admin`. Clerk owns
the application session, while Sanity stores products and orders.

The first implementation rendered `@sanity/sdk-react` inside the custom Next.js
route. Sanity App SDK is designed to run inside the Sanity Dashboard iframe,
where the dashboard injects the current Sanity user's token. Its production
runtime redirects a standalone, non-local application to Sanity Dashboard for
authentication. Localhost is explicitly exempt from that redirect, which made
the defect appear production-only.

## Decision

- Clerk remains the identity provider for `/admin`.
- The signed-in Clerk email must also match an administrator, editor, or
  developer on the configured Sanity project.
- Admin pages fetch Sanity data on the Next.js server after authorization.
- Admin mutations use Server Actions that call `requireAdminAccess()` before
  using the server-only Sanity write client.
- `SANITY_API_WRITE_TOKEN` must never be included in browser JavaScript.
- `/studio` remains a separate advanced editing surface and legitimately uses
  Sanity membership authentication.

## Rejected alternatives

### Expose a Sanity token through a `NEXT_PUBLIC_` variable

Rejected because any visitor can download a public JavaScript bundle and
extract the token. Route-level Clerk checks do not protect a secret embedded in
static browser assets.

### Keep App SDK and proxy or imitate its authentication protocol

Rejected because the App SDK relies on Dashboard/Studio token lifecycle,
refresh, live event, and document action semantics. Reimplementing that protocol
inside the storefront would be brittle and unnecessary.

### Require both Clerk and Sanity login for `/admin`

Rejected because it creates two independent sessions for the same custom
dashboard and caused the production redirect reported here.

## Consequences

- The production `/admin` route no longer launches Sanity App SDK or redirects
  to `sanity.io`.
- Sanity credentials stay server-only and every read/write has an explicit
  authorization boundary.
- Admin data is refreshed after mutations using Next.js path revalidation.
- Sanity Studio continues to be available for schema-level and advanced edits.

## Validation

- Verify signed-out `/admin` requests return to Clerk sign-in.
- Verify a Clerk user without a matching Sanity project role receives the
  access-required page.
- Verify an authorized user can list, create, edit, and delete products; upload
  images; list orders; and update order status/address.
- Verify the production browser never navigates from `/admin` to `sanity.io`.
