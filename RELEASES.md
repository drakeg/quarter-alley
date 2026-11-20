# Releases and versioning

Quarter Alley uses [Semantic Versioning](https://semver.org) for tagged GitHub releases of the site:

- **MAJOR:** a change players or saved data can't carry across (e.g. a wallet or score reset, removing a game).
- **MINOR:** new games, features or platform capabilities.
- **PATCH:** fixes, balance tweaks and doc corrections worth announcing.

`main` is always live on GitHub Pages; a merge publishes it. A release is a named, tested snapshot, cut when a meaningful set of player-facing changes is ready — not on every merge.

**Release checklist:** changes reviewed and merged · CI green on `main` · no secrets or protected names · badges accurate · SPRINTS and BACKLOG updated · release notes below · tag `vX.Y.Z` and publish a GitHub release with the same notes.

## Unreleased → planned v1.0.0

First tagged release, to be cut once the Sprint 1 standards PR is merged.

- 24 original games, playable on desktop and phone, with gamepad and touch support where it fits
- Token wallet and coin slot; sign-in with server-side wallets, admins and leaderboards
- Token shop on Stripe Checkout (hidden until Stripe is connected)
- Quality gates: static checks, browser tests for every game, CI, CodeQL, Docker Compose test server
