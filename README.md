# Quarter Alley Arcade

<!-- madmallard-badges:start -->
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white) ![Docker Compose](https://img.shields.io/badge/Docker%20Compose-2496ED?logo=docker&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=white)

[![ci](https://github.com/drakeg/quarter-alley/actions/workflows/ci.yml/badge.svg)](https://github.com/drakeg/quarter-alley/actions/workflows/ci.yml) [![codeql](https://github.com/drakeg/quarter-alley/actions/workflows/codeql.yml/badge.svg)](https://github.com/drakeg/quarter-alley/actions/workflows/codeql.yml) [![License](https://img.shields.io/github/license/drakeg/quarter-alley)](https://github.com/drakeg/quarter-alley/blob/HEAD/LICENSE) [![Release](https://img.shields.io/github/v/release/drakeg/quarter-alley)](https://github.com/drakeg/quarter-alley/releases/latest) [![Issues](https://img.shields.io/github/issues/drakeg/quarter-alley)](https://github.com/drakeg/quarter-alley/issues) [![Pull requests](https://img.shields.io/github/issues-pr/drakeg/quarter-alley)](https://github.com/drakeg/quarter-alley/pulls)
<!-- madmallard-badges:end -->

[![Pages deploy](https://github.com/drakeg/quarter-alley/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/drakeg/quarter-alley/actions/workflows/pages/pages-build-deployment) [![Live site](https://img.shields.io/website?url=https%3A%2F%2Fdrakeg.github.io%2Fquarter-alley%2F&label=live%20site)](https://drakeg.github.io/quarter-alley/) [![Last commit](https://img.shields.io/github/last-commit/drakeg/quarter-alley)](https://github.com/drakeg/quarter-alley/commits/main) [![Commit activity](https://img.shields.io/github/commit-activity/m/drakeg/quarter-alley)](https://github.com/drakeg/quarter-alley/pulse) ![HTML5](https://img.shields.io/badge/HTML5%20Canvas-E34F26?logo=html5&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white) ![Deno](https://img.shields.io/badge/Edge%20Functions-Deno-000000?logo=deno&logoColor=white) ![Stripe](https://img.shields.io/badge/Stripe-Checkout-635BFF?logo=stripe&logoColor=white) ![Playwright](https://img.shields.io/badge/Tests-Playwright-2EAD33?logo=playwright&logoColor=white)

A website of original retro-style browser games, live at **[drakeg.github.io/quarter-alley](https://drakeg.github.io/quarter-alley/)**. The site is plain HTML with no build step; accounts, wallets, leaderboards and the token shop run on Supabase, and payments on Stripe.

## Games

| Game | What it is |
|---|---|
| **Stack Shack** | Platform game. Walk across ingredients to drop them onto plates and build four burgers while dodging angry produce. |
| **Prairie Schooner** | Trail survival strategy. Lead a covered wagon from Missouri to Oregon or California in 1849. Saves progress in the browser. |
| **Ashfall** | One-on-one fighting game with four elemental fighters, special moves, a CPU arcade ladder, two-player versus and gamepad support. |
| **Glitch Grid** | Maze chase. Steer a cleanup drone through a neon maze, collect the data bits and dodge four glitches with different hunting styles. |
| **Sunset Circuit** | Pseudo-3D racer. One qualifying lap sets your grid spot, then three laps against seven CPU rivals. |
| **Spore Storm** | Shooter. A firefly fires up through a field of glowing spores at a segmented crawler that splits when hit. |
| **Rascal Road** | Crossing game. Hop a raccoon across traffic and a creek to fill five dens before the timer runs out. |
| **Iron Treads** | Top-down tanks with destructible brick. Campaign of 20-tank stages defending a beacon, plus a 2-player duel. |
| **Starfall** | Defense. Fire flares from three batteries to burst meteors before they hit six seaside towns. |
| **Ridgeline** | First-person 3D tank combat with radar, built with three.js. |
| **Driftrock** | Space shooter. A drifting ship splits glowing rocks into smaller pieces; saucers hunt you. |
| **Lifeline** | Side-scrolling rescue shooter. Stop snatchers carrying off colonists and catch them as they fall. |
| **Canopy Run** | Jungle adventure. Vines, tar pits, crocodiles, tunnels and sixteen treasures against a ten-minute clock. |
| **Spring Brawl** | Toy-robot boxing. Jab, haymaker, guard and dodge until a head pops off its spring. Ladder or 2 players. |
| **Hive Swarm** | Fixed shooter vs clockwork bugs that dive from formation. Win back a captured ship to fly double. |
| **Starting Blocks** | Four-event track meet: 100 m, hurdles, long jump and javelin. Make the qualifying marks. |
| **Burrow Bash** | Dig under the garden, pump pests until they pop and drop stones on them. |
| **Marsh Shot** | Aim-and-fire bird shoot at sundown with a hound who laughs at your misses. 1 bird, 2 birds or clay discs. |
| **Brickwave** | Paddle and bricks across twelve neon walls, with power-ups. |
| **Bunker Line** | Hold the moon base against a marching grid of glow drones from behind crumbling bunkers. |
| **Soft Landing** | Lunar lander: feather thrust and fuel to touch down softly on multiplier pads. |
| **Cube Hop** | Hop a pyramid of cubes to change every top to the target color, dodging bouncers and a spring chaser. |
| **Fenceline** | Draw fences to claim 75% of the field while a roaming tangle and border embers hunt you. |
| **Lightline** | Trail duel: your rider leaves a wall of light. Solo vs CPU riders or two players. |

```
quarter-alley/
├── index.html                        ← arcade home page (game list)
├── assets/
│   ├── favicon.svg
│   └── arcade.js                     ← shared tokens, coin slot and bug reporter
└── games/
    ├── stack-shack/index.html        ← each game is fully self-contained
    ├── prairie-schooner/index.html
    ├── ashfall/index.html
    ├── glitch-grid/index.html
    ├── sunset-circuit/index.html
    ├── spore-storm/index.html
    ├── rascal-road/index.html
    ├── iron-treads/index.html
    ├── starfall/index.html
    ├── ridgeline/index.html
    ├── driftrock/index.html
    ├── lifeline/index.html
    ├── canopy-run/index.html
    ├── spring-brawl/index.html
    ├── hive-swarm/index.html
    ├── starting-blocks/index.html
    ├── burrow-bash/index.html
    ├── marsh-shot/index.html
    ├── brickwave/index.html
    ├── bunker-line/index.html
    ├── soft-landing/index.html
    ├── cube-hop/index.html
    ├── fenceline/index.html
    └── lightline/index.html
├── leaderboards/index.html           ← public high scores (needs accounts)
├── supabase/schema.sql               ← database for accounts, tokens and scores
├── supabase/payments.sql             ← purchase ledger for the token shop
├── supabase/support.sql              ← refunds and the contact inbox
├── supabase/functions/               ← shop + stripe-webhook (Edge Functions)
├── docs/LOGIN.md                     ← how to switch on accounts
├── docs/PAYMENTS.md                  ← how to connect Stripe for the token shop
├── legal/terms · legal/privacy · legal/refunds  ← policy pages
├── contact/                          ← contact form (private inbox in Supabase)
├── tests/                            ← static checks + browser tests (npm test)
├── docker-compose.yml                ← LAN test server and containerized tests
└── AGENTS.md · CONTRIBUTING.md · SPRINTS.md · BACKLOG.md · RELEASES.md · SECURITY.md
```

## Try it locally

Opening `index.html` directly works, but a local server behaves exactly like real hosting.

**Docker Compose (recommended, reachable from your phone on the same Wi-Fi):**

```bash
docker compose up -d
```

Open http://localhost:8080 on this computer, or `http://<this computer's LAN IP>:8080` on a phone or tablet (on a Mac: `ipconfig getifaddr en0`). Edits show up on refresh. Use `QA_PORT=9000 docker compose up -d` for another port, and `docker compose down` to stop.

**Without Docker:** `npm run serve` (or `python3 -m http.server 8080 --bind 0.0.0.0`).

## Testing

```bash
npm ci
npm test                                      # static checks + browser tests
docker compose --profile test run --rm tests  # same browser tests, inside Docker, against the Compose server
```

- `npm run lint` checks every page's scripts compile, every game is wired to the coin slot and registered on the hub, leaderboards and bug form, and that no secret keys are in the site.
- `npm run e2e` (Playwright) boots every game and plays it for a few seconds with no script errors, and checks the hub, leaderboards and coin slot on desktop and phone. Tests run offline: accounts are skipped and libraries are served locally.
- GitHub Actions runs all of this, a Docker Compose check, the Mad Mallard standards check and CodeQL on every pull request.

## Put it on the web

Any static host works. Upload the **contents** of this folder as the site root.

- **Netlify** (easiest): go to app.netlify.com/drop and drag the project folder onto the page. You get a live URL in seconds, and can attach your own domain later.
- **Cloudflare Pages**: Create project → Upload assets → drop the folder.
- **GitHub Pages**: in this repo, Settings → Pages → Deploy from a branch → `main`, `/ (root)`. The site appears at `https://drakeg.github.io/quarter-alley/`.
- **Your own server** (Apache/Nginx/shared hosting): copy the files into the web root (e.g. `/var/www/html` or `public_html`) via SFTP. No configuration needed.

HTTPS is recommended (all the hosts above provide it free).

## Originality rule

Every game here is an original design: its own name, characters, story and art. Classic games, films and shows can inspire the gameplay, but their names, characters and catchphrases must never appear anywhere in the code, the page text, the README or the roadmap.

## Adding another game

1. Create `games/<new-game>/index.html` (keep each game self-contained in its folder).
2. Add a link back to the arcade: `<a href="../../">← Back to the arcade</a>`
3. Include `../../assets/arcade.js` and start the game through `Arcade.insertCoin(...)`.
4. Open `index.html` and add an entry to the `GAMES` list near the bottom: title, folder link, a short description, tags, and an SVG for the cabinet screen.
5. Add the game's name to `GAMES` at the top of `assets/arcade.js` and to `.github/ISSUE_TEMPLATE/bug_report.yml`.

## Tokens

Every game start goes through `Arcade.insertCoin(callback)` in `assets/arcade.js`, which shows the coin-slot screen and spends one token.

- Guests hold up to **2** free tokens; one returns every 10 minutes. Signed-in wallets currently retain the legacy server cap of 30 until the planned five-free-token SQL migration is deployed. Each page shows when the next one arrives.
- Admins (set in the database, see `docs/LOGIN.md`) play free and can give tokens to other players.
- Settings are at the top of `assets/arcade.js` (`maxTokens`, `refillMinutes`, `freePlay`). Keep them in step with the numbers in `supabase/schema.sql`.
- Add `?freeplay` to any game URL to test without spending tokens.
- Guests' tokens live in their browser (localStorage), where anyone can edit them. Signed-in players' tokens live on the server, which is the groundwork for selling tokens later.

To gate a new game, include the script and wrap its start:

```html
<script src="../../assets/arcade.js"></script>
<script>
  function start(){ /* begin the game */ }
  Arcade.insertCoin(start, { label: 'My Game · 1 token = 1 game' });
</script>
```

## Accounts and leaderboards

Players can sign in with an email link, Google or GitHub. Signed-in players' tokens live on the server and their scores go to the [leaderboards](leaderboards/). New signed-in players currently start with 30 tokens on the server; the approved five-free-token migration is pending. Guests still play with tokens saved in their browser. Setup notes are in [docs/LOGIN.md](docs/LOGIN.md). Games report scores with `Arcade.submitScore(score)` at game over.

## Community and sponsorships

Join [GitHub Discussions](https://github.com/drakeg/quarter-alley/discussions) to suggest original games, ask gameplay questions, and share feedback. See [community and sponsorship guidance](docs/COMMUNITY.md) for discussion categories, moderation and supporter plans. Account and payment matters belong in the private [contact form](contact/), not public discussions.

## Roadmap and contributing

Current sprint and plan: [SPRINTS.md](SPRINTS.md). Prioritized work: [BACKLOG.md](BACKLOG.md). Releases: [RELEASES.md](RELEASES.md). How to contribute: [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md). Security: [SECURITY.md](SECURITY.md).

## Bug reports

Every page has a **Report a bug** button. It collects a short description and opens a new GitHub issue in this repo with the game, the page and browser details filled in (the reporter needs a free GitHub account). Issue templates for bugs and ideas live in `.github/ISSUE_TEMPLATE/`.

## Notes

- Fonts load from Google Fonts. If they can't load, the games fall back to system fonts and still work.
- High scores and tokens are stored in each player's browser (localStorage), not on a server. Shared leaderboards and paid tokens would need a small backend later.
