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

## Sprint 1 — Standards and quality gates (current)

**Goal:** Adopt the Mad Mallard standards so every change is tested and reviewable.

- [x] AGENTS, CONTRIBUTING, SECURITY, SPRINTS, BACKLOG, RELEASES; roadmap moved from TODO.md into BACKLOG.md
- [x] Static checks: script syntax, game registration, leaked-secret scan
- [x] Browser tests: every game boots and survives input; hub, leaderboards and coin slot on desktop and phone
- [x] GitHub Actions CI, CodeQL, Dependabot, PR template
- [x] Docker Compose test server reachable on the LAN, plus a containerized test run
- [x] Accurate, dynamic README badges
- [ ] Merged after review, then tag **v1.0.0**

**Acceptance:** CI green on the PR; standards audit and badge check pass; `docker compose up` serves the site to another device on the network.

## Sprint 2 — First paying customer (next)

**Goal:** Everything needed for Stripe to approve the account and for a stranger to buy tokens with confidence.

- Terms, Privacy and Refund policy pages, plus a contact route, linked from every page footer (Stripe requires these to activate an account)
- Refunds automatically take back the refunded tokens (`charge.refunded`)
- Purchase history in the account menu
- Owner steps (Greg): Supabase URL configuration, connect Stripe in test mode, confirm the admin email, custom email sender
- Decide the free-tier settings that make buying worthwhile (owner decision; see BACKLOG)

**Acceptance:** A test-mode purchase on the live site credits tokens; a refund removes them; the policy pages are live.

## Sprint 3 — New cabinets

**Goal:** Fresh games to bring players back.

- Back It In (reverse a fifth wheel into tight campsites)
- Girder Gang (climb girders, dodge rolling barrels)
- Root Beer Rush (slide mugs down four saloon bars)

**Acceptance:** Each game passes the browser tests, has touch controls and submits scores.

## Sprint 4 — Retention

**Goal:** Reasons to return daily.

- Weekly leaderboards and a score of the day
- Install as an app (PWA) with offline guest play
- Global settings: volume, key remapping, reduced motion
