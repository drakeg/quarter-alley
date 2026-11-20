# Security policy

## Reporting a problem

Please **don't** post credentials, personal data or working exploits in public issues. Report privately through GitHub's **Report a vulnerability** button on the Security tab if it's enabled, or contact the repository owner privately first. Include the impact, the affected page or function, and safe steps to reproduce.

## What matters most here

- **Player wallets and purchases.** Token balances and purchases live in Supabase behind row-level security. Players can read only their own wallet and purchases; spending, crediting and granting happen in database functions that check who is calling.
- **Payments.** Card details are handled entirely by Stripe Checkout. The `stripe-webhook` function accepts only requests carrying a valid Stripe signature from the last five minutes, and each Checkout session can be credited once.
- **Keys.** Only the public anon key ships in the site. The service_role key and Stripe keys exist only as Supabase secrets. CI fails if a secret-looking key appears in the site or docs.
- **Guest tokens** live in the browser and can be edited by the player. That's accepted: they are free and never convert to anything paid.

## Automation

Workflows run with read-only permissions (CodeQL additionally writes security alerts). Fork pull requests never receive secrets. Renovate (`renovate.json`) proposes updates to actions, test packages and the Docker test image; review them like any other change. GitHub's Dependabot security alerts stay on.

## Supported versions

The live site (`main`) is the only supported version.
