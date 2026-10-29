# Turning on player accounts

The arcade works without accounts: everyone plays as a guest and tokens and high scores stay in their browser. Switching on accounts lets players:

- sign in with an email link, Google or GitHub
- keep their tokens on every device (tokens are spent on the server, so they can't be edited in the browser)
- save high scores and appear on the [leaderboards](../leaderboards/)

Accounts use [Supabase](https://supabase.com), which has a free tier that comfortably covers a hobby arcade.

## 1. Create the project (about 5 minutes)

1. Sign up at supabase.com and click **New project**. Pick any name (for example `quarter-alley`), set a database password, and choose the region closest to most players.
2. When it's ready, open **SQL Editor → New query**, paste the whole of [`supabase/schema.sql`](../supabase/schema.sql), and click **Run**. You should see "Success. No rows returned."

## 2. Tell Supabase where the site lives

Open **Authentication → URL Configuration**:

- **Site URL:** `https://drakeg.github.io/quarter-alley/` (or your custom domain)
- **Redirect URLs:** add `https://drakeg.github.io/quarter-alley/**` and, for local testing, `http://localhost:8000/**`

## 3. Connect the site

Open **Project Settings → API** and copy:

- the **Project URL** (looks like `https://abcdxyz.supabase.co`)
- the **anon public** key

Paste them into the `CONFIG` block at the top of `assets/arcade.js`:

```js
supabaseUrl: 'https://abcdxyz.supabase.co',
supabaseAnonKey: 'eyJhbGciOi...'
```

The anon key is designed to be public. The database rules in `schema.sql` decide what each player may read and change. Never paste the **service_role** key into the site.

Commit and push. A **Sign in** button now works on every page.

## 4. Optional: Google and GitHub sign-in

Email links work as soon as the steps above are done. To add the buttons for Google and GitHub:

- **GitHub:** create an OAuth app at github.com → Settings → Developer settings → OAuth Apps. Use the callback URL shown in Supabase under **Authentication → Providers → GitHub**, then paste the app's Client ID and Secret into that Supabase page and enable it.
- **Google:** create OAuth credentials in Google Cloud Console (APIs & Services → Credentials → OAuth client ID → Web application) with the callback URL Supabase shows under **Authentication → Providers → Google**, then paste the ID and secret into Supabase and enable it.

Until a provider is enabled, its button tells players to use the email link instead.

## How it fits together

| Piece | Where |
|---|---|
| Sign-in window, account menu, coin slot, score saving | `assets/arcade.js` |
| Tables, security rules, token and score functions | `supabase/schema.sql` |
| Public leaderboards | `leaderboards/index.html` |

- **Tokens:** guests keep a local balance. Signed-in players use their server wallet: 10 to start, topped back up to 10 each day (UTC), one spent per game through `spend_token()`.
- **Scores:** games call `Arcade.submitScore(score)` at game over. Signed-in players' scores are saved; guests get a prompt to sign in.
- **Leaderboards:** `top_scores(game)` returns each player's best score for a game, top 10.

Scores are still reported by the player's browser, so a determined cheater could fake one. Server-side replay checks are a possible later step if leaderboards start to matter (for example, prizes).

## Selling tokens later

The wallet lives on the server now, which is the groundwork for paid tokens. The usual next step is Stripe Checkout plus a small Supabase Edge Function that receives Stripe's payment webhook and adds tokens to the buyer's wallet.
