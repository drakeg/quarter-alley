# Token tiers — Sprint 2 implementation contract

Status: implementation planned; **not deployed**. This document is the acceptance contract for the wallet migration, frontend and payment changes.

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

## Deployment gate

Do not claim this feature shipped merely because the migration file or docs exist. Production requires a verified SQL migration, successful browser and payment tests, and explicit deployment evidence.
