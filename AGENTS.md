# Agent operating instructions

Applies to people and AI agents working in this repository. Follows the [Mad Mallard repository standards](https://github.com/drakeg/madmallard-repository-standards); the project rules below take precedence where they are stricter.

## Before you change anything

1. Read README, [SPRINTS.md](SPRINTS.md), [BACKLOG.md](BACKLOG.md), [CONTRIBUTING.md](CONTRIBUTING.md), [RELEASES.md](RELEASES.md), [SECURITY.md](SECURITY.md) and the workflows in `.github/workflows/`.
2. Tie the change to the current sprint or a backlog item. Urgent fixes may go first, then get recorded.
3. Work on a branch and open a pull request. `main` deploys straight to GitHub Pages, so nothing lands there without passing CI and a human review.

## Project rules (non-negotiable)

- **Originality.** Every game is an original design with its own name, characters, story and art. Classics, films and shows may inspire gameplay, but their names, characters and catchphrases never appear in code, page text, docs, commit messages, PRs or issues.
- **No personal data in the repo.** Never commit anyone's email address. Admin rights are granted directly in Supabase, never by code.
- **Secrets stay out of the site.** Only the public Supabase anon key may ship in `assets/arcade.js`. The service_role key and Stripe secrets live only in Supabase secrets. `npm run lint` fails if one leaks.
- **Static site.** No build step for the site itself. `package.json` exists only for tests.
- **Prices live on the server.** Token packs are defined in `supabase/functions/shop/index.ts` and `supabase/functions/stripe-webhook/index.ts`; change both together.

## Adding a game

1. Create `games/<slug>/index.html`, fully self-contained, with the link back (`href="../../"`), `../../assets/arcade.js`, and a start that goes through `Arcade.insertCoin(...)`.
2. Guard the frame loop against odd first frames: `const dt = Math.max(0, Math.min(.033, (now - last) / 1000));`
3. Register it: a card in the `GAMES` list in `index.html`; the `games` list in `assets/arcade.js` if it calls `Arcade.submitScore`; the dropdown in `.github/ISSUE_TEMPLATE/bug_report.yml`; the README table and file tree; [BACKLOG.md](BACKLOG.md).
4. `npm test` checks the wiring and runs every game in a real browser.

## Testing

```bash
npm ci
npm run lint        # syntax, registration, leaked secrets (no browser)
npm run e2e         # every game + hub + coin slot, desktop and phone
docker compose up -d   # LAN test server on :8080 (see README)
```

Report test failures accurately; never mark a check as passing without running it.

## Badges and docs

- Badges sit directly under the README's H1. The block between the `madmallard-badges` markers is generated: run the standards repo's `scripts/badges.py --repo . --mode write`, never hand-edit it. Project badges go on the line after the block and must point at live, dynamic sources.
- Update SPRINTS, BACKLOG and RELEASES in the same PR as the work.

## Database and functions

- Schema changes go in `supabase/*.sql` (safe to re-run) and are applied to the `quarter-alley` Supabase project as a migration.
- Edge Functions live in `supabase/functions/<name>/index.ts` and are deployed from there. `stripe-webhook` must stay deployed with JWT checks off; it verifies Stripe's signature instead.
