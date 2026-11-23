# Token tiers — Sprint 2 implementation contract

Status: server migration, frontend support, and automated SQL/browser tests are implemented in a development PR. **Not deployed or validated with a live Stripe test checkout/refund.** This remains the acceptance contract.

## Player tiers

| Tier | Free-token cap | Additional tokens | Rules |
| --- | ---: | --- | --- |
| Guest | 2 | None | Browser-only wallet; no purchases |
| Registered | 5 | 0 initially | Authenticated, server-owned wallet |
| Paid | 5 | Purchased credits | Persistent status after first successful purchase, even if credits are spent |
| Admin | Unlimited | Preserved but not consumed | Server-authorized `is_admin`; never charged |

A paid account is not a subscription. A first successfully credited Stripe purchase permanently marks it as paid for account-history purposes. Revoked/refunded purchases must not silently erase the purchase record or paid history. A separate subscription tier may be added later.

## Balance and refill invariants

- Store `free_tokens` and `bonus_tokens` (purchases and admin gifts) separately; return a total `tokens` for compatibility with existing clients.
- Refill **only** `free_tokens`, one token every ten minutes, up to five for authenticated players. Guests refill only to two.
- Consume free credits before bonus credits. A purchase or gift must never prevent free-credit regeneration.
- Admin games increment `games_played` but deduct neither balance.
- Never migrate a wallet by blindly truncating its old `tokens` value. Preserve old balance above the new five-token free cap as bonus credits; preserve payment history.
- The migration must be idempotent and safe for existing users; take a database backup before running it.
- Refunds affect bonus credits and purchase ledger only, never free credits; duplicate Stripe events remain idempotent. If bonus credits have already been spent, track any unrecovered reversal as a debt/adjustment rather than silently taking free credits.
- Wallet mutations occur in server-side SQL functions; RLS must prevent client balance changes. Do not trust a browser-supplied tier or admin flag.
- An authenticated player with a failed wallet fetch must not silently fall back to a guest wallet and spend local tokens.

## Implementation order

1. Add an additive Supabase migration and updated wallet functions with a compatibility `tokens` field.
2. Update purchase-credit, refund and admin-grant functions; test retries, partial refunds and spent-credit refunds.
3. Update `assets/arcade.js` for separate guest cap, signed-in free cap, balance display, countdown and login transitions.
4. Add unit/SQL integration and browser tests for all four tiers and cross-device account persistence.
5. Update README, LOGIN, PAYMENTS, SPRINTS, BACKLOG and RELEASES, then deploy to a test Supabase environment.
6. Run the real test-mode checkout and refund before deploying the database migration to production.

## Acceptance cases

- Fresh guest starts at 2, cannot exceed 2 by regeneration; guest play deducts one.
- Fresh registered account starts at 5 and refills toward 5 only.
- Paid account starts with five free tokens plus purchased tokens; purchased tokens remain after free refill.
- After all purchased tokens are spent, paid status remains.
- Admin never spends credits, even with zero balances.
- Existing users with >5 legacy tokens retain the excess as bonus credits.
- Duplicate purchase and refund webhook deliveries cannot credit or reverse twice.
- A partial refund only reverses the appropriate purchased credits.
- A signed-in server failure blocks paid gameplay instead of using guest credits.
- All existing 24 game coin slots and the account menu work on desktop and mobile.

## Migration and staging procedure

1. Take a complete Supabase database backup. Confirm the linked project, backup and restoration path.
2. Run SQL in this order in an isolated staging project: `supabase/schema.sql`, `supabase/payments.sql`, `supabase/support.sql`, then `supabase/token-tiers.sql`. On an existing deployment, only run the **last** file after confirming the earlier scripts were already applied.
3. Review `wallets.tokens`, `free_tokens`, `bonus_tokens`, `refund_debt`, `has_purchased` and the purchases ledger before/after migration. Legacy 30-credit balances are preserved as 5 free + 25 bonus credits.
4. Use Stripe **test-mode** Checkout and webhook retries; test partial/full refunds after bought credits have been spent. Test an admin gift and signed-in/offline wallet behavior.
5. Deploy the static frontend only after staging checks succeed. The frontend detects the new `get_wallet_details()` RPC and falls back to the existing `get_wallet()` only when the new function is absent.
6. Once verified, apply the migration to production with a fresh backup and monitor wallet/payment errors. Do **not** reapply older `schema.sql`, `payments.sql` or `support.sql` over the migrated functions afterward: the baseline files still contain legacy functions.

CI runs `supabase/token-tiers.sql` twice against isolated PostgreSQL plus `tests/sql/*` to validate preserved balances, paid state, admin permissions, free-first spending, refill, duplicate purchases, partial refunds, refund debt, and reapplication.

## Deployment gate

Do not claim this feature shipped merely because the migration file or docs exist. Production requires a verified SQL migration, successful browser and payment tests, and explicit deployment evidence.
