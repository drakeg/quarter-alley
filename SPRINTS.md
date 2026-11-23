# Product vision and sprints

**Vision:** Quarter Alley is a free-to-try arcade of original retro-style games that play well on a phone or a laptop. Every player gets free tokens; players who want more buy token packs. The fastest realistic path to revenue is turning on the token shop and getting the first paying player, then adding games and features that keep people coming back.

Sprints run one after another; scope changes go through the backlog. Each sprint records its goal, deliverables, acceptance criteria and outcome.

## Sprint 0 — Foundation and catalog ✅

**Goal:** A playable arcade worth sharing.

- [x] 24 original games on the floor (see README)
- [x] Coin slot and token wallet (30 free, one back every 10 minutes)
- [x] Sign-in (email link, Google, GitHub) with server-side wallets, admins and leaderboards
- [x] Token shop built on Stripe Checkout, hidden until Stripe is connected
- [x] Report-a-bug button and issue templates

**Outcome:** Live on GitHub Pages; accounts connected to Supabase; shop code deployed.

## Sprint 1 — Standards and quality gates ✅

**Goal:** Adopt the Mad Mallard standards so every change is tested and reviewable.

- [x] AGENTS, CONTRIBUTING, SECURITY, SPRINTS, BACKLOG, RELEASES; roadmap moved from TODO.md into BACKLOG.md
- [x] Static checks: script syntax, game registration, leaked-secret scan
- [x] Browser tests: every game boots and survives input; hub, leaderboards and coin slot on desktop and phone
- [x] GitHub Actions CI, CodeQL, dependency updates (Renovate), PR template
- [x] Docker Compose test server reachable on the LAN, plus a containerized test run
- [x] Accurate, dynamic README badges
- [x] Merged after review ([#2](https://github.com/drakeg/quarter-alley/pull/2))
- [x] Published the [v1.0.0](https://github.com/drakeg/quarter-alley/releases/tag/v1.0.0) release

**Outcome:** CI, CodeQL, standards and Docker Compose checks green on `main`.

**Acceptance:** CI green on the PR; standards audit and badge check pass; `docker compose up` serves the site to another device on the network.

## Sprint 2 — First paying customer (current)

**Goal:** Everything needed for Stripe to approve the account and for a stranger to buy tokens with confidence.

- [x] Terms, Privacy and Refund policy pages, linked from the home page, leaderboards and the shop
- [x] Contact page with a private, rate-limited inbox (no email address published)
- [x] Refunds and disputes automatically take back tokens (`charge.refunded`, `charge.dispute.created`)
- [x] Purchase history in the account menu
- [x] Tests: policy pages, contact form, purchase history; static check for broken links
- [ ] Owner steps: Supabase URL configuration, connect Stripe in test mode, confirm the admin email, custom email sender, review the policy pages
- [x] Owner decision: guest 2, registered 5, paid 5 + purchased credits, admin unlimited
- [x] Limit guest browser wallets to 2 free tokens (existing guest balances above 2 are capped)
- [x] Restrict free-play debugging to localhost/loopback; public URLs always enforce the coin slot (regression test)
- [x] Implement version-compatible free/bonus wallet code, paid status, refund debt and SQL/browser regression checks (development branch)
- [ ] Verify staging SQL migration and Stripe test-mode checkout/refund; then deploy the five-free-token server policy (see docs/TOKEN-TIERS.md)

**Acceptance:** A test-mode purchase on the live site credits tokens; a refund removes them; the policy pages are live.

## Sprint 3 — New cabinets

**Goal:** Fresh games to bring players back.

- [x] Back It In: original fifth-wheel parking simulator with keyboard, touch and gamepad, three sites and scores (PR pending CI)
- Girder Gang (climb girders, dodge rolling barrels)
- Root Beer Rush (slide mugs down four saloon bars)

**Acceptance:** Each game passes the browser tests, has touch controls and submits scores.

## Sprint 4 — Retention

**Goal:** Reasons to return daily.

- Weekly leaderboards and a score of the day
- Install as an app (PWA) with offline guest play
- Global settings: volume, key remapping, reduced motion
