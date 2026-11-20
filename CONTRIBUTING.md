# Contributing

Bug reports, game ideas and pull requests are welcome, including AI-authored ones. Use the **Report a bug** button on any page or the issue templates for bugs and ideas.

## Workflow

1. Branch from `main` (`feat/…`, `fix/…`, `docs/…`, `chore/…`).
2. Keep commits small. Conventional Commits are preferred: `feat:`, `fix:`, `docs:`, `test:`, `chore:`.
3. Follow [AGENTS.md](AGENTS.md), especially the originality rule: no names, characters or catchphrases from existing games, films, shows or brands, anywhere.
4. Run `npm test` (static checks plus browser tests). Add or update tests when behavior changes.
5. Open a pull request using the template: link the sprint or backlog item, say what changed, how you tested it, the risk and how to roll back.
6. CI must pass and a human must review before a squash merge. Merging to `main` publishes the site.

## Definition of Ready

The item has a reason a player or the business cares about, clear acceptance criteria, known dependencies, and fits in a sprint.

## Definition of Done

- Acceptance criteria met, playable on desktop and phone.
- `npm test` and CI green; no leaked secrets; no protected names.
- README, SPRINTS, BACKLOG and RELEASES updated as needed; badges still accurate.
- Reviewed and merged; the backlog item is closed or updated.

## Accessibility

Games and pages need keyboard controls, visible focus, readable contrast and touch controls where it makes sense. Don't use color alone to show status.
