const { test, expect } = require('@playwright/test');
const { GAMES, prepare } = require('./helpers');

test('home page shows a cabinet for every game', async ({ page }) => {
  const errors = await prepare(page);
  await page.goto('./');
  await expect(page.locator('#cabinets a[href^="games/"]')).toHaveCount(GAMES.length);
  await expect(page.locator('.qa-chip').first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'no sideways scrolling').toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test('leaderboards page loads without accounts', async ({ page }) => {
  const errors = await prepare(page);
  await page.goto('./leaderboards/');
  await expect(page.locator('h1, h2').first()).toContainText(/high scores/i);
  await expect(page.locator('body')).toContainText(/could not be loaded|no scores/i); // offline: a friendly message, not a crash
  expect(errors).toEqual([]);
});

test('coin slot spends a guest token', async ({ page }) => {
  const errors = await prepare(page);
  await page.goto('./games/brickwave/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const before = await page.evaluate(() => Arcade.tokens());
  expect(before).toBe(30);
  await page.evaluate(() => { window.__started = false; Arcade.insertCoin(() => { window.__started = true; }); });
  await expect(page.locator('.qa-door')).toBeVisible();
  await page.locator('[data-coin]').click();
  await expect.poll(() => page.evaluate(() => window.__started), { timeout: 5000 }).toBe(true);
  expect(await page.evaluate(() => Arcade.tokens())).toBe(29);
  expect(errors).toEqual([]);
});

test('signed-in player sees purchase history and policy links', async ({ page }) => {
  const errors = await prepare(page);
  // Stand-in for the Supabase client: one signed-in player with two purchases (one partly refunded).
  await page.addInitScript(() => {
    const rows = [
      { created_at: '2026-11-18T12:00:00Z', pack: 'roll', tokens: 200, amount_cents: 499, refunded_tokens: 0 },
      { created_at: '2026-11-10T12:00:00Z', pack: 'pocket', tokens: 60, amount_cents: 199, refunded_tokens: 30 },
    ];
    const chain = (result) => new Proxy({}, { get: (_, k) => (k === 'then' ? (res) => res(result) : k === 'maybeSingle' ? async () => result : () => chain(result)) });
    window.supabase = { createClient: () => ({
      auth: { getSession: async () => ({ data: { session: { access_token: 't', user: { id: 'u1', email: 'player@example.com' } } } }), onAuthStateChange: () => {}, signOut: async () => ({}) },
      rpc: async (n) => (n === 'get_wallet' ? { data: [{ tokens: 12, games_played: 3, is_admin: false, last_regen: new Date().toISOString() }] } : { data: 0 }),
      from: (t) => chain(t === 'purchases' ? { data: rows } : { data: { display_name: 'Tester' } }),
    }) };
  });
  await page.goto('./');
  await page.getByRole('button', { name: /Tester/ }).click();
  const hist = page.locator('.qa-hist');
  await expect(hist).toContainText('Purchases (2)');
  await hist.locator('summary').click();
  await expect(hist).toContainText('200 tokens');
  await expect(hist).toContainText('30 refunded');
  await expect(hist.getByRole('link', { name: 'refund policy' })).toHaveAttribute('href', './legal/refunds/');
  expect(errors).toEqual([]);
});
