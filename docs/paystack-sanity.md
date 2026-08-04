# Paystack and Sanity payment flow

Paystack and Sanity are compatible. Paystack confirms the charge; the server
then creates a published `order` document in Sanity and decrements inventory in
the same transaction.

## Production configuration

Set these variables in the production deployment (not only in a local `.env`):

```bash
NEXT_PUBLIC_BASE_URL=https://www.adiressence.store
PAYSTACK_SECRET_KEY=sk_live_or_test_key_for_the_same_environment
SANITY_API_WRITE_TOKEN=token_with_create_and_update_access
```

In the Paystack dashboard, set the webhook URL for the matching Test or Live
environment to:

```text
https://www.adiressence.store/webhook/paystack
```

The application sends an explicit callback URL for every transaction:

```text
https://www.adiressence.store/api/paystack/callback
```

The callback URL does not need to be entered in the dashboard because it is
included during transaction initialization. The webhook URL still needs to be
configured in Paystack so an order is fulfilled even if the buyer closes the
payment tab before returning to the store.

## Expected successful flow

1. Checkout calculates the authoritative price and stock from Sanity.
2. The server initializes Paystack with a unique reference and signed-in user
   metadata.
3. Paystack returns the buyer to `/api/paystack/callback?reference=...`.
4. The callback verifies the reference, amount, currency, status, and metadata
   directly with Paystack.
5. The callback or `charge.success` webhook creates one deterministic Sanity
   order and updates stock atomically.
6. `/shop/success` reads that exact order through Sanity's direct document API.
7. The published order appears in My Orders, Sanity Studio, and `/admin/orders`.

## Verification

Run:

```bash
npm run test:security
npm run typecheck
npm run build
```

After deployment, make one Test Mode payment from the production domain and
confirm that Paystack's transaction metadata contains a `cancel_action` origin
of `https://www.adiressence.store`, not a temporary `*.vercel.app` deployment.
