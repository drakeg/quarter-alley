# Prioritized backlog

Every game is an original design with its own name, characters and art. Never use the names, characters or catchphrases of existing games, films, shows or brands anywhere in the code or documentation.

**Priorities:** P0 blocks the first paying customer or breaks the site · P1 grows players or revenue · P2 nice to have. Reprioritize through issues or PRs. An item's presence here doesn't mean it's done; shipped items are marked ✅.

## Platform and revenue


| Priority | Item | Sprint | Status |
|---|---|---|---|
| P0 | Mad Mallard standards: docs, CI, tests, Docker Compose, badges | 1 | ✅ Done (#2) |
| P1 | Configure GitHub Discussions templates, category guidance and community links | 2 | In progress |
| P1 | Verify GitHub Sponsors payout profile and add an approved funding destination (FUNDING.yml) | 2 | Waiting on verified sponsor URL |
| P1 | Plan sponsorship recognition without promising unimplemented paid features | Later | Planned |
| P0 | Terms, Privacy and Refund policy pages + contact route in the footer (needed for Stripe activation) | 2 | In review |
| P0 | Owner: review the policy pages (plain-language drafts, not legal advice) | 2 | Waiting on owner |
| P0 | Owner: publish the v1.0.0 GitHub release | 1 | ✅ Done |
| P0 | Owner: set Site URL and redirect URLs in Supabase (Authentication → URL Configuration, `docs/LOGIN.md` step 2) | 2 | Waiting on owner |
| P0 | Owner: connect Stripe in test mode (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, see `docs/PAYMENTS.md`) | 2 | Waiting on owner |
| P0 | Owner: confirm the admin account's email so admin rights can be granted in Supabase | 2 | Waiting on owner |
| P1 | Refunds and disputes take back the refunded tokens | 2 | In review |
| P1 | Purchase history in the account menu | 2 | In review |
| P2 | Owner: add `charge.refunded` and `charge.dispute.created` to the Stripe webhook events when connecting Stripe | 2 | Waiting on owner |
| P2 | Email the owner when a contact message arrives (Supabase database webhook or scheduled digest) | Later | Backlog |
| P0 | Implement four token tiers (guest 2, registered 5, paid 5 + purchases, admin unlimited); preserve existing balances and payment/refund integrity (docs/TOKEN-TIERS.md) | 2 | Code in review; production migration pending |
| P1 | Custom email sender (SMTP) in Supabase; the built-in sender only sends a few emails an hour | 2 | Waiting on owner |
| P1 | Sponsor slots for small businesses (e.g. campgrounds, RV dealers): billboards in Sunset Circuit, cabinet marquees | Later | Backlog |
| P1 | Supporter tier: unlimited play and cosmetic skins (Stripe subscription) | Later | Backlog |
| P1 | Weekly leaderboards and a score of the day | 4 | Planned |
| P1 | Install as an app (PWA) and offline guest play | 4 | Planned |
| P2 | Profile page: display name, avatar color, play history | Later | Backlog |
| P2 | Optional "watch a short ad for 5 tokens" | Later | Backlog |
| P2 | Bug reports without a GitHub account (form service or Supabase table) | Later | Backlog |
| P2 | Custom domain | Later | Backlog |
| P2 | Global settings: sound volume, key remapping, reduced motion | 4 | Planned |
| P2 | Privacy-friendly visit counts per game | Later | Backlog |
| P2 | Shared sprite and sound helpers to keep new games small | Later | Backlog |

Shipped: ✅ token wallet (30 free, one back every 10 minutes) · ✅ admin accounts with unlimited tokens and a Give tokens form · ✅ coin slot on every game · ✅ sign-in with email link, Google or GitHub · ✅ server-side wallets and scores · ✅ leaderboards page · ✅ Supabase project connected · ✅ token shop on Stripe Checkout with webhook and purchase ledger · ✅ report-a-bug button.

## Games

| Priority | Game | Pitch | Sprint |
|---|---|---|---|
| P1 | **Back It In** | Reverse a fifth wheel into tight campsites while a lawn-chair crowd heckles; trees, slopes and a points-costing pull-through | 3 |
| P1 | **Girder Gang** | Climb girders and dodge rolling barrels to reach the top | 3 |
| P1 | **Root Beer Rush** | Slide mugs down four saloon bars to thirsty cowhands and catch the empties | 3 |
| P2 | **Flipside** | Full pinball table with flippers, bumpers, ramps and multiball | Later |
| P2 | **Roll Alley** | Roll balls up an inclined lane into scoring rings for prize tickets | Later |
| P2 | **Morning Route** | Bike a street delivering papers to subscribers, breaking windows at the rest | Later |
| P2 | **Stomp City** | Up to three giant monsters climb and wreck buildings while the army fights back | Later |
| P2 | **Dungeon Four** | Four-player co-op dungeon crawl with draining health and shared food | Later |
| P2 | **Lift Heist** | A spy rides elevators down an office tower grabbing documents from red doors | Later |
| P2 | **Crater Rover** | Moon buggy jumps craters and shoots saucers, checkpoints A to Z | Later |
| P2 | **Ice Shove** | A penguin slides ice blocks to squash blob creatures in a maze | Later |
| P2 | **Tower Siege** | One off-duty hero, one skyscraper taken over on a holiday night; fight floor by floor to the roof | Later |
| P2 | **Trench Runner** | 3D space-fighter run down a fortress trench to hit a single exhaust port | Later |
| P2 | **Leapwise** | Wake up in a stranger's life in a different decade; put one thing right before you leap again | Later |
| P2 | **Skyknights** | Riders on flying mounts clash in the air, great for two players | Later |
| P2 | **Blast Block** | Bomb-maze party game for up to 4 gamepads | Later |
| P2 | **Twin Fury** | Twin-stick arena survival | Later |
| P2 | **Tube Rider** | Shoot your way down a 3D tube | Later |

On the floor ✅ (24): Stack Shack · Prairie Schooner · Ashfall · Glitch Grid · Sunset Circuit · Spore Storm · Rascal Road · Iron Treads · Starfall · Ridgeline · Driftrock · Lifeline · Canopy Run · Spring Brawl · Hive Swarm · Starting Blocks · Burrow Bash · Marsh Shot · Brickwave · Bunker Line · Soft Landing · Cube Hop · Fenceline · Lightline.

## Polish

| Priority | Item |
|---|---|
| P1 | Touch controls review on small phones for every game |
| P1 | Ashfall: arcade-mode score (damage, time, flawless bonus) so it can join the leaderboards |
| P2 | Balance pass on Ashfall (damage, CPU blocking, special cooldowns) |
| P2 | Difficulty tuning for the six newest games after real play |
| P2 | Glitch Grid: short intermission scenes between levels |
| P2 | Sunset Circuit: second track and night mode |
| P2 | Iron Treads: more stages and a stage editor |
| P2 | Prairie Schooner: more river and trail events, illustrated landmark scenes |
