---
title: AdirEssence authentication and admin project memory
memory_version: 1
last_updated: 2026-08-24
status: implementation-complete-deployment-verification-pending
retrieval_tags:
  - adiressence
  - clerk
  - sanity
  - admin
  - authentication
  - production-redirect
  - vercel
  - localhost
---

# AdirEssence authentication and admin project memory

This is the durable handoff for the Clerk and Sanity admin work completed on
2026-08-24. It deliberately contains no secret values. Use it together with
the accepted architecture decision in [admin-auth-architecture.md](./admin-auth-architecture.md).

The garment measurement feature added on the same date is documented in
[garment-sizing-architecture.md](./garment-sizing-architecture.md).

## Current status

- The production-only `/admin` redirect was diagnosed and fixed in the codebase.
- The custom admin now uses Clerk for the application session and server-only
  Sanity access for data operations.
- The Sanity App SDK was removed from the standalone Next.js admin.
- The implementation is committed on `main` and `origin/main` at `d352748`.
- Local verification passed. Production still needs a fresh deployment and
  browser-level acceptance testing after its environment variables are checked.
- A structured sizing feature for trousers, shorts, jorts, and skirts is
  implemented in the working tree. It is validated locally but is not yet
  committed or deployed.

## Garment sizing feature memory

- Applicable category documents now have a `sizingMode`: `alpha`, `trouser`,
  `shorts`, `skirt`, or `none`. Known shirt/top and measured-garment category
  slugs work as a fallback, but categories should still be explicitly
  classified in Sanity Studio.
- `alpha` categories require one of `S`, `M`, `L`, `XL`, `2XL`, `3XL`, or
  `4XL`. It is used for shirts and related tops. Different sizes of the same
  product remain separate cart/order lines while sharing aggregate stock.
- Required order-line sizing records fit profile, customer-selected unit,
  natural waist circumference, hip/seat circumference, and a category-specific
  length measurement.
- Fit profile values are men's cut, women's cut, and unisex/custom cut. This is
  a garment construction choice, not a customer identity assertion.
- Trousers use crotch-to-ankle inside leg. Shorts and jorts use crotch-to-hem
  inseam. Skirts use natural-waist-to-hem length; they do not use "leg length."
- Inputs provide common suggestions through a datalist while accepting exact
  custom numeric values. Inches and centimetres are both supported, and the
  original unit is preserved on the order.
- Measurement ranges are category-specific. In particular, shorts may be 2–20
  inches and skirts 10–50 inches; a universal 20-inch length minimum would
  reject ordinary short garments.
- Cart identity is product plus measurement configuration, allowing the same
  design to be ordered for two measurement sets. Stock validation and inventory
  decrement aggregate those lines by product.
- Checkout resolves the authoritative category in Sanity, validates compulsory
  letter sizes or measurements server-side, carries them in Paystack metadata
  version 3, and snapshots them into Sanity order items during idempotent
  fulfilment.
- Selected sizes and measurements appear in the cart, payment summary, customer
  order detail, admin order detail, and Sanity order document.
- Sanity schema and query types were regenerated after adding the category and
  order-item fields.
- Validation passed: TypeScript, focused lint, optimized production build, and
  all 18 payment/security tests. Full lint retains the same 13 unrelated legacy
  errors and 5 warnings already listed below.

### Garment sizing deployment checklist

1. Review and commit the sizing working tree, including generated
   `schema.json` and `sanity.types.ts`.
2. In Sanity Studio, open each applicable category and set:
   - shirts/T-shirts/tops to `Shirts / tops — S to 4XL`;
   - trousers/pants to `Trousers`;
   - shorts/jorts to `Shorts / jorts`;
   - skirts to `Skirts`;
   - every other category to `No sizing`.
3. Deploy the application and test one product from every sizing mode in both
   inches and centimetres.
4. Verify payment completion creates order-item `sizing` data and that the same
   measurements render in customer and admin order detail pages.
5. Verify two differently configured lines of one product cannot collectively
   exceed stock.

## Semantic memory: facts and boundaries

### Identity and authorization

- Clerk is the only browser-facing identity provider for `/admin`.
- A signed-in Clerk user is authorized only when the user's email matches a
  member of the configured Sanity project with one of these roles:
  `administrator`, `editor`, or `developer`.
- `sanity/lib/auth.ts` implements this authorization boundary.
- Every admin query and mutation must authorize on the server. A hidden button
  or client-side route check is never sufficient authorization.
- `/studio` is a separate advanced content surface and may legitimately ask for
  a Sanity login. The custom `/admin` route must not ask for a Sanity login.

### Clerk environments

- Production uses Clerk production keys (`pk_live_…` and `sk_live_…`).
- Localhost must use Clerk development keys (`pk_test_…` and `sk_test_…`).
  Clerk production keys do not support `localhost` as the application origin.
- Clerk development and production instances have separate users. A user that
  exists in one instance does not automatically appear in the other.
- The production Clerk domain and Frontend API DNS were verified as healthy.
  At diagnosis time, `/admin` correctly reached Clerk and redirected signed-out
  users to `accounts.adiressence.store/sign-in`.

### Sanity credentials

- `SANITY_API_WRITE_TOKEN` is server-only and is used by the server-side Sanity
  client after `requireAdminAccess()` succeeds.
- Never create or retain `NEXT_PUBLIC_SANITY_API_TOKEN`. Any `NEXT_PUBLIC_`
  token is bundled into browser JavaScript and is not a secret.
- The production deployment needs these variable names, with values stored only
  in the deployment provider:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `NEXT_PUBLIC_SANITY_PROJECT_ID`
  - `NEXT_PUBLIC_SANITY_DATASET`
  - `NEXT_PUBLIC_SANITY_API_VERSION`
  - `SANITY_API_WRITE_TOKEN`

### Architecture decision

- Do not mount `@sanity/sdk-react` in the standalone Next.js `/admin` route.
- Sanity App SDK expects the Sanity Dashboard iframe to inject authentication.
  In production, a standalone non-local app redirects to Sanity Dashboard;
  localhost is exempt. That difference caused the misleading "works locally"
  behavior.
- Admin reads run in Next.js server code. Admin writes use authorized Server
  Actions. The Sanity write token never enters the client bundle.
- Product edits in the custom admin update published documents directly.
  Draft/publish and schema-level workflows remain available in `/studio`.

## Episodic memory: what happened

1. After Clerk was switched to live keys, the account indicator was missing on
   localhost and production `/admin` appeared not to route correctly.
2. The Clerk production domain, SSL, DNS, sign-in redirect, and Frontend API
   were checked and found healthy. The localhost issue was traced to using live
   Clerk keys locally and to the separation between development and production
   Clerk users.
3. Authentication controls and clearer admin-access handling were added in
   commit `ac2085c` (`admin rectify`), including signed-in/user-button and
   signed-out/sign-in states in the storefront navigation.
4. A second production trace showed `/admin` displaying a black Sanity loading
   screen and then navigating to `sanity.io/login`, while localhost worked.
5. Inspection of the installed Sanity App SDK proved that standalone production
   apps redirect to Sanity Dashboard. This was an SDK architecture mismatch,
   not a Clerk or DNS failure.
6. The accepted design was recorded in `docs/admin-auth-architecture.md`.
7. Commit `d352748` rebuilt the active admin route tree around server-rendered
   queries and Server Actions, removed the browser SDK provider/components, and
   removed `@sanity/sdk-react` from dependencies.

## Implemented admin behavior

- `/admin`: server-rendered dashboard statistics, recent orders, low-stock
  information, AI insights, and product creation.
- `/admin/inventory`: server-side product listing, search/filtering, and product
  creation.
- `/admin/inventory/[id]`: product editing, deletion, image upload/removal, and
  an advanced Studio link.
- `/admin/orders`: server-side order listing with status and search filters.
- `/admin/orders/[id]`: order details plus status and address updates.
- `sanity/lib/admin-queries.ts`: server-only typed queries; each exported query
  calls `requireAdminAccess()`.
- `sanity/lib/admin-actions.ts`: authorized Server Actions for product CRUD,
  image operations, and order updates.
- `next.config.ts`: Server Action body size allows image uploads up to the
  application limit; image actions accept images only and enforce an 8 MB cap.

## Validation already completed

- `npm run typecheck` passed.
- Focused linting for all changed admin, query, action, and configuration files
  passed.
- `npm run test:security` passed all 11 tests.
- `npm run build` produced an optimized production build. The admin routes are
  dynamic server routes.
- Generated bundles contained neither `Redirecting to core` nor
  `Loading Sanity App SDK`.
- `git diff --check` passed before the implementation commit.

Full-repository lint still reported unrelated pre-existing issues in landing
page/section components, `ProductFilters`, `sidebar.tsx`, and test scripts.
Dependency installation also reported 36 audit findings (1 low, 11 moderate,
21 high, and 3 critical). Neither cleanup was part of the admin repair and both
should be handled as separate work.

## Procedural memory: deployment and acceptance checklist

1. Confirm Vercel Production has the production Clerk keys and the required
   Sanity variables listed above.
2. Delete `NEXT_PUBLIC_SANITY_API_TOKEN` from every deployment environment if it
   exists. Do not copy its value anywhere.
3. Keep `.env.local` on Clerk development keys for localhost.
4. Redeploy commit `d352748` or a later commit containing it. Environment changes
   require a new deployment to affect the built application.
5. In a private browser window, visit `https://www.adiressence.store/admin` and
   confirm a signed-out user reaches Clerk sign-in.
6. Sign in with a Clerk production user whose email is a Sanity project member
   with an allowed role. Confirm the custom admin loads without navigating to
   `sanity.io`.
7. Sign in with a Clerk user that lacks the required Sanity membership and
   confirm the access-required screen appears.
8. Test product create/edit/delete, image upload/removal, order listing, order
   status changes, and address changes.
9. Use `/studio` only for advanced Sanity workflows and expect Sanity's own
   authentication there.

## Troubleshooting retrieval cues

- **Admin redirects to Sanity login:** an App SDK provider or dependency has
  probably been reintroduced. Search for `@sanity/sdk-react`, `SanityApp`, and
  `SanityAppProvider`.
- **Localhost has no production account:** verify local `pk_test_`/`sk_test_`
  keys and create/sign in to the user in Clerk's development instance.
- **Production sign-in works but access is denied:** compare the Clerk primary
  email with Sanity project membership and allowed roles; also verify the
  server-only Sanity token can read project access data.
- **Production still runs old behavior:** verify the deployed commit and trigger
  a redeploy after environment changes.
- **Sanity returns unauthorized errors:** verify `SANITY_API_WRITE_TOKEN` exists
  server-side, has the needed permissions, and was not placed in a public env
  variable.

## Memory maintenance

- Update `last_updated`, `status`, and the current verified commit whenever the
  architecture, environment contract, or deployment state changes.
- Newer verified facts supersede older mutable facts such as deployment status.
- Preserve the Clerk/Sanity security boundary unless a new architecture
  decision explicitly replaces the accepted ADR.
- Never add real keys, tokens, passwords, user emails, or other secrets to this
  file.
