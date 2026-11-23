# Token shop (Stripe)

Signed-in players can buy token packs. Bought tokens are added to the server wallet and never expire. The tier migration in `supabase/token-tiers.sql` separates them from regenerating free credits (cap 5) and tracks spent-credit refund debt; until that migration is deployed, the legacy 30-token wallet behavior remains in effect.

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
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded` and `charge.dispute.created`
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
| Refund tracking, `refund_purchase()`, contact inbox | `supabase/support.sql` |
| Policy and contact pages | `legal/`, `contact/` |

1. The player picks a pack. The site asks the `shop` function, which checks who is signed in and opens a Stripe Checkout page with the server's price.
2. The player pays on Stripe's page. Quarter Alley never sees card details.
3. Stripe sends a signed notice to `stripe-webhook`. The function checks the signature, then calls `credit_purchase()`, which records the purchase and adds the tokens.
4. Each Checkout session can only be credited once, so if Stripe re-sends a notice, nobody gets double tokens.
5. Players can read their own purchases; only the server can write them.

**Refunds and disputes:** when you refund a purchase in Stripe (fully or partly), or a buyer disputes the charge, the webhook calls `refund_purchase()`, which takes back tokens in proportion to the money returned (never below zero). After the tier migration, only bonus credits can be reversed; spent credits become refund debt, not a deduction from regenerating free tokens. Stripe sends the running refund total, so repeated notices don't take tokens twice. Players see refunds in their purchase history.

**Policies:** Terms, Privacy and Refund policy pages are at `legal/terms/`, `legal/privacy/` and `legal/refunds/`, linked from the home page footer and the shop. Stripe asks for these during account activation. Review them before going live; they are a plain-language starting point, not legal advice.

**Support inbox:** the contact page saves messages to the `messages` table (Supabase → Table Editor → messages). Nobody but the project owner can read it. Each email address can send 3 messages an hour and the whole site 60, which keeps spam down.
