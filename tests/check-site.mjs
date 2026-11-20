// Static checks for the arcade: script syntax, game registration, page wiring and leaked secrets.
// Run: npm run lint   (no browser needed)
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');
const errors = [];
const fail = (msg) => errors.push(msg);

const games = readdirSync(join(root, 'games')).filter((d) => statSync(join(root, 'games', d)).isDirectory()).sort();
const extra = ['leaderboards', 'contact', 'legal/terms', 'legal/privacy', 'legal/refunds'];
const pages = ['index.html', ...extra.map((d) => `${d}/index.html`), ...games.map((g) => `games/${g}/index.html`)];

// 1. Every inline script and shared script compiles.
function compile(code, where) {
  try { new vm.Script(code, { filename: where }); } catch (e) { fail(`${where}: ${e.message}`); }
}
for (const page of pages) {
  if (!existsSync(join(root, page))) { fail(`${page}: missing`); continue; }
  const html = read(page);
  const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  let m, n = 0;
  while ((m = re.exec(html))) {
    const attrs = m[1] || '';
    if (/\bsrc=/.test(attrs) || /type=["'](?!text\/javascript)/.test(attrs)) continue;
    compile(m[2], `${page} <script #${++n}>`);
  }
}
for (const f of readdirSync(join(root, 'assets')).filter((f) => f.endsWith('.js'))) compile(read(`assets/${f}`), `assets/${f}`);

// 2. Each game page is wired to the arcade: back link, shared script, coin slot.
for (const g of games) {
  const html = read(`games/${g}/index.html`);
  if (!/href=["']\.\.\/\.\.\/["']/.test(html)) fail(`games/${g}: no link back to the arcade (href="../../")`);
  if (!html.includes('../../assets/arcade.js')) fail(`games/${g}: does not load ../../assets/arcade.js`);
  if (!html.includes('Arcade.insertCoin')) fail(`games/${g}: never calls Arcade.insertCoin, so it skips tokens`);
  if (!/<title>[^<]{2,}<\/title>/.test(html)) fail(`games/${g}: missing <title>`);
}

// 3. Registration: hub cards, leaderboard list and bug-report dropdown agree with the games folder.
const hub = read('index.html');
const hubSlugs = [...hub.matchAll(/href:\s*["']games\/([a-z0-9-]+)\/["']/g)].map((m) => m[1]);
for (const g of games) if (!hubSlugs.includes(g)) fail(`index.html: no card for games/${g}`);
for (const s of hubSlugs) if (!games.includes(s)) fail(`index.html: card points at missing games/${s}`);

const arcade = read('assets/arcade.js');
const list = arcade.slice(arcade.indexOf('games: ['));
const arcadeSlugs = [...list.matchAll(/\['([a-z0-9-]+)',\s*'[^']+'\]/g)].map((m) => m[1]);
for (const s of arcadeSlugs) if (!games.includes(s)) fail(`assets/arcade.js games list: missing folder games/${s}`);
for (const g of games) {
  if (read(`games/${g}/index.html`).includes('Arcade.submitScore') && !arcadeSlugs.includes(g)) {
    fail(`games/${g} submits scores but is not in the Arcade.games list in assets/arcade.js (leaderboards)`);
  }
}
const titles = [...hub.matchAll(/title:\s*"([^"]+)"/g)].map((m) => m[1]);
const bugForm = read('.github/ISSUE_TEMPLATE/bug_report.yml');
for (const t of titles) if (!bugForm.includes(t)) fail(`bug_report.yml: "${t}" is not in the game dropdown`);

// 4. Policy pages are linked from the home page and every policy page links the others (needed for payment approval).
for (const link of ['legal/terms/', 'legal/privacy/', 'legal/refunds/', 'contact/']) {
  if (!hub.includes(`href="${link}"`)) fail(`index.html: footer is missing a link to ${link}`);
}
for (const d of extra.filter((d) => d !== 'leaderboards')) {
  const html = read(`${d}/index.html`);
  for (const link of ['legal/terms/', 'legal/privacy/', 'legal/refunds/']) if (!html.includes(link)) fail(`${d}: no link to ${link}`);
  if (/<a\s[^>]*href=["']mailto:/i.test(html)) fail(`${d}: don't publish an email address; use the contact form`);
}

// 4b. Every relative link, script, stylesheet and icon in page markup points at something that exists.
for (const page of pages) {
  const dir = page.slice(0, page.lastIndexOf('/') + 1);
  const markup = read(page).replace(/<script(\s[^>]*)?>[\s\S]*?<\/script>/gi, (m, a) => (a && /\bsrc=/.test(a) ? `<script${a}>` : ''));
  for (const [, url] of markup.matchAll(/\s(?:href|src)=["']([^"'#?]*)[^"']*["']/g)) {
    if (!url || /^(?:[a-z]+:|\/\/|\$\{)/i.test(url)) continue;
    const target = join(root, dir, url);
    const ok = url.endsWith('/') ? existsSync(join(target, 'index.html')) : existsSync(target);
    if (!ok) fail(`${page}: broken link "${url}"`);
  }
}

// 5. Secrets never ship in the site or repo.
const scan = ['assets/arcade.js', ...pages, 'README.md', 'docs/LOGIN.md', 'docs/PAYMENTS.md',
  'supabase/functions/shop/index.ts', 'supabase/functions/stripe-webhook/index.ts'].filter((p) => existsSync(join(root, p)));
for (const p of scan) {
  const text = read(p);
  if (/sk_(live|test)_[A-Za-z0-9]{10,}|whsec_[A-Za-z0-9]{10,}|rk_(live|test)_[A-Za-z0-9]{10,}/.test(text)) fail(`${p}: looks like a Stripe secret key`);
  for (const jwt of text.match(/eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g) || []) {
    try {
      const claims = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString());
      if (claims.role !== 'anon') fail(`${p}: contains a Supabase key with role "${claims.role}" (only the public anon key may ship)`);
    } catch { fail(`${p}: contains an unreadable token`); }
  }
}

if (errors.length) {
  console.error(`✗ ${errors.length} problem(s):\n` + errors.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log(`✓ ${pages.length} pages, ${games.length} games: scripts compile, games are wired and registered, no secrets.`);
