# Quarter Alley Arcade

A static website of original retro-style browser games. No build step, no server code, no database: just HTML files.

## Games

| Game | What it is |
|---|---|
| **Stack Shack** | Platform game. Walk across ingredients to drop them onto plates and build four burgers while dodging angry produce. |
| **Prairie Schooner** | Trail survival strategy. Lead a covered wagon from Missouri to Oregon or California in 1849. Saves progress in the browser. |
| **Ashfall** | One-on-one fighting game with four elemental fighters, special moves, a CPU arcade ladder, two-player versus and gamepad support. |
| **Glitch Grid** | Maze chase. Steer a cleanup drone through a neon maze, collect the data bits and dodge four glitches with different hunting styles. |
| **Sunset Circuit** | Pseudo-3D racer. One qualifying lap sets your grid spot, then three laps against seven CPU rivals. |

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
    └── sunset-circuit/index.html
```

## Try it locally

Opening `index.html` directly works, but a local server behaves exactly like real hosting:

```
cd quarter-alley
python3 -m http.server 8000
```

Then visit http://localhost:8000

## Put it on the web

Any static host works. Upload the **contents** of this folder as the site root.

- **Netlify** (easiest): go to app.netlify.com/drop and drag the project folder onto the page. You get a live URL in seconds, and can attach your own domain later.
- **Cloudflare Pages**: Create project → Upload assets → drop the folder.
- **GitHub Pages**: in this repo, Settings → Pages → Deploy from a branch → `main`, `/ (root)`. The site appears at `https://drakeg.github.io/quarter-alley/`.
- **Your own server** (Apache/Nginx/shared hosting): copy the files into the web root (e.g. `/var/www/html` or `public_html`) via SFTP. No configuration needed.

HTTPS is recommended (all the hosts above provide it free).

## Adding another game

1. Create `games/<new-game>/index.html` (keep each game self-contained in its folder).
2. Add a link back to the arcade: `<a href="../../">← Back to the arcade</a>`
3. Include `../../assets/arcade.js` and start the game through `Arcade.insertCoin(...)`.
4. Open `index.html` and add an entry to the `GAMES` list near the bottom: title, folder link, a short description, tags, and an SVG for the cabinet screen.
5. Add the game's name to `GAMES` at the top of `assets/arcade.js` and to `.github/ISSUE_TEMPLATE/bug_report.yml`.

## Tokens

Every game start goes through `Arcade.insertCoin(callback)` in `assets/arcade.js`, which shows the coin-slot screen and spends one token.

- New players get 10 tokens, and the balance is topped back up to 10 every day.
- Settings are at the top of `assets/arcade.js` (`startTokens`, `dailyTokens`, `freePlay`).
- Add `?freeplay` to any game URL to test without spending tokens.
- Tokens live in the player's browser (localStorage). That is fine for free tokens, but anyone can edit them, so selling tokens for real money needs a small backend with accounts and server-side balances.

To gate a new game, include the script and wrap its start:

```html
<script src="../../assets/arcade.js"></script>
<script>
  function start(){ /* begin the game */ }
  Arcade.insertCoin(start, { label: 'My Game · 1 token = 1 game' });
</script>
```

## Bug reports

Every page has a **Report a bug** button. It collects a short description and opens a new GitHub issue in this repo with the game, the page and browser details filled in (the reporter needs a free GitHub account). Issue templates for bugs and ideas live in `.github/ISSUE_TEMPLATE/`.

## Notes

- Fonts load from Google Fonts. If they can't load, the games fall back to system fonts and still work.
- High scores and tokens are stored in each player's browser (localStorage), not on a server. Shared leaderboards and paid tokens would need a small backend later.
