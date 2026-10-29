# Quarter Alley Arcade

A static website of original retro-style browser games. No build step, no server code, no database: just HTML files.

```
retro-arcade/
├── index.html                  ← arcade home page (game list)
├── assets/favicon.svg
└── games/
    └── stack-shack/index.html  ← the game (fully self-contained)
```

## Try it locally

Opening `index.html` directly works, but a local server behaves exactly like real hosting:

```
cd retro-arcade
python3 -m http.server 8000
```

Then visit http://localhost:8000

## Put it on the web

Any static host works. Upload the **contents** of `retro-arcade/` as the site root.

- **Netlify** (easiest): go to app.netlify.com/drop and drag the `retro-arcade` folder onto the page. You get a live URL in seconds, and can attach your own domain later.
- **Cloudflare Pages**: Create project → Upload assets → drop the folder.
- **GitHub Pages**: push the folder contents to a repo, then Settings → Pages → deploy from the `main` branch.
- **Your own server** (Apache/Nginx/shared hosting): copy the files into the web root (e.g. `/var/www/html` or `public_html`) via SFTP. No configuration needed.

HTTPS is recommended (all the hosts above provide it free).

## Adding another game

1. Create `games/<new-game>/index.html` (keep each game self-contained in its folder).
2. Add a link back to the arcade: `<a href="../../">← Back to the arcade</a>`
3. Open `index.html` and add an entry to the `GAMES` list near the bottom: title, folder link, a short description, tags, and an SVG for the cabinet screen.

## Notes

- Fonts load from Google Fonts. If they can't load, the games fall back to system fonts and still work.
- High scores are stored in each player's browser (localStorage), not on the server. A shared online leaderboard would need a small backend later.
