# Releases and versioning

Quarter Alley uses [Semantic Versioning](https://semver.org) for tagged GitHub releases of the site:

- **MAJOR:** a change players or saved data can't carry across (e.g. a wallet or score reset, removing a game).
- **MINOR:** new games, features or platform capabilities.
- **PATCH:** fixes, balance tweaks and doc corrections worth announcing.

`main` is always live on GitHub Pages; a merge publishes it. A release is a named, tested snapshot, cut when a meaningful set of player-facing changes is ready — not on every merge.

**Release checklist:** changes reviewed and merged · CI green on `main` · no secrets or protected names · badges accurate · SPRINTS and BACKLOG updated · release notes below · tag `vX.Y.Z` and publish a GitHub release with the same notes.

## Unreleased → planned v1.1.0

- Terms of use, Privacy and Refund policy pages; contact page with a private inbox
- Refunds and disputes in Stripe take back tokens automatically
- Purchase history in the account menu
- Broken-link check in the static tests

## v1.0.0 — 2026-11-20 (tag pending)

First release, from `main` at the merge of #2. The GitHub release itself still needs publishing by the owner.

- 24 original games, playable on desktop and phone, with gamepad and touch support where it fits
- Token wallet and coin slot; sign-in with server-side wallets, admins and leaderboards
- Token shop on Stripe Checkout (hidden until Stripe is connected)
- Quality gates: static checks, browser tests for every game, CI, CodeQL, Docker Compose test server
