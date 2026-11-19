# Token shop (Stripe)

Signed-in players can buy token packs. Bought tokens are added to their server-side wallet, never expire, and stack on top of the free tokens (free tokens still refill only up to 30).

The shop stays hidden on the site until Stripe is connected. Once the two secrets below are set, a **Buy tokens** button appears in the account menu and on the "Out of tokens" screen, with no change to the site needed.

## Packs

| Pack | Tokens | Price |
|---|---|---|
| Pocketful of Tokens | 60 | $1.99 |
| Roll of Tokens | 200 | $4.99 |
| Bucket of Tokens | 500 | $9.99 |

To change them, edit `PACKS` in both `supabase/functions/shop/index.ts` and `supabase/functions/stripe-webhook/index.ts`, then redeploy both functions. Prices live on the server only, so players can't change what they pay.

## Connect Stripe (about 10 minutes)

Start in Stripe's **test mode** (the toggle at the top of the Stripe dashboard) so no real money moves.

1. Create an account at stripe.com.
2. **Developers → API keys:** copy the **Secret key** (`sk_test_…`).
3. **Developers → Webhooks → Add endpoint:**
   - Endpoint URL: `https://elnvjgphoptaycrneqso.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed` and `checkout.session.async_payment_succeeded`
   - After saving, copy the endpoint's **Signing secret** (`whsec_…`).
4. In Supabase, open the quarter-alley project → **Edge Functions → Secrets** and add:
   - `STRIPE_SECRET_KEY` = the secret key
   - `STRIPE_WEBHOOK_SECRET` = the signing secret
5. Reload the site, sign in, open your account menu and click **Buy tokens**. Pay with Stripe's test card `4242 4242 4242 4242`, any future date and any CVC. You land back on the same page and the tokens appear within a few seconds.

Never put the Stripe secret key or the Supabase service_role key in the site or the repo.

## Going live

1. In Stripe, finish **account activation** (business details and the bank account for payouts).
2. Switch the dashboard out of test mode and repeat steps 2–4 with the **live** keys and a **live** webhook endpoint (same URL).
3. Buy the smallest pack yourself once to confirm, then refund it from the Stripe dashboard if you like.

## How it works

| Piece | Where |
|---|---|
| Shop window, Buy tokens buttons, return from checkout | `assets/arcade.js` (`openShop`) |
| Pack list and Stripe Checkout session | `supabase/functions/shop` |
| Payment notice from Stripe, adds the tokens | `supabase/functions/stripe-webhook` |
| Purchase ledger and `credit_purchase()` | `supabase/payments.sql` |

1. The player picks a pack. The site asks the `shop` function, which checks who is signed in and opens a Stripe Checkout page with the server's price.
2. The player pays on Stripe's page. Quarter Alley never sees card details.
3. Stripe sends a signed notice to `stripe-webhook`. The function checks the signature, then calls `credit_purchase()`, which records the purchase and adds the tokens.
4. Each Checkout session can only be credited once, so if Stripe re-sends a notice, nobody gets double tokens.
5. Players can read their own purchases; only the server can write them.

Refunds made in Stripe don't remove tokens automatically. If that matters later, add `charge.refunded` to the webhook.
