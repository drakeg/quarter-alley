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
  expect(before).toBe(2);
  await page.evaluate(() => { window.__started = false; Arcade.insertCoin(() => { window.__started = true; }); });
  await expect(page.locator('.qa-door')).toBeVisible();
  await page.locator('[data-coin]').click();
  await expect.poll(() => page.evaluate(() => window.__started), { timeout: 5000 }).toBe(true);
  expect(await page.evaluate(() => Arcade.tokens())).toBe(1);
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
      rpc: async (n) => (n === 'get_wallet_details' ? { data: [{ tokens: 12, free_tokens: 5, bonus_tokens: 7, games_played: 3, is_admin: false, has_purchased: true, refund_debt: 0, last_regen: new Date().toISOString() }] } : { data: 0 }),
      from: (t) => chain(t === 'purchases' ? { data: rows } : { data: { display_name: 'Tester' } }),
    }) };
  });
  await page.goto('./');
  await page.getByRole('button', { name: /Tester/ }).click();
  await expect(page.locator('.qa-form')).toContainText('Paid tier');
  await expect(page.locator('.qa-form')).toContainText('5 free + 7 bonus tokens');
  const hist = page.locator('.qa-hist');
  await expect(hist).toContainText('Purchases (2)');
  await hist.locator('summary').click();
  await expect(hist).toContainText('200 tokens');
  await expect(hist).toContainText('30 refunded');
  await expect(hist.getByRole('link', { name: 'refund policy' })).toHaveAttribute('href', './legal/refunds/');
  expect(errors).toEqual([]);
});

test('signed-in account errors never silently spend the guest wallet', async ({ page }) => {
  const errors = await prepare(page);
  await page.addInitScript(() => {
    const chain = new Proxy({}, { get: (_, k) => k === 'then' ? (resolve) => resolve({ data: { display_name: 'Player' } }) : k === 'maybeSingle' ? async () => ({ data: { display_name: 'Player' } }) : () => chain });
    window.supabase = { createClient: () => ({
      auth: { getSession: async () => ({ data: { session: { user: { id: 'offline-player', email: 'test@example.com' } } } }), onAuthStateChange: () => {} },
      rpc: async () => ({ error: { code: 'PGRST301', message: 'server unavailable' } }),
      from: () => chain,
    }) };
  });
  await page.goto('./games/brickwave/');
  await expect.poll(() => page.evaluate(() => Arcade.signedIn)).toBe(true);
  await expect.poll(() => page.evaluate(() => Arcade.tokens())).toBe(0);
  await page.evaluate(() => Arcade.insertCoin(() => { window.__started = true; }));
  await expect(page.locator('.qa-door')).toBeVisible();
  await expect(page.locator('.qa-door')).toContainText('OUT OF TOKENS');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('qa-wallet')).tokens)).toBe(2);
  expect(errors).toEqual([]);
});

test('free token refill is independent of purchased token balance', async ({ page }) => {
  const errors = await prepare(page);
  await page.addInitScript(() => {
    const chain = new Proxy({}, { get: (_, k) => k === 'then' ? (resolve) => resolve({ data: { display_name: 'Paying player' } }) : k === 'maybeSingle' ? async () => ({ data: { display_name: 'Paying player' } }) : () => chain });
    window.supabase = { createClient: () => ({
      auth: { getSession: async () => ({ data: { session: { user: { id: 'paid-player', email: 'paid@example.com' } } } }), onAuthStateChange: () => {} },
      rpc: async (n) => n === 'get_wallet_details'
        ? { data: [{ tokens: 8, free_tokens: 1, bonus_tokens: 7, games_played: 0, is_admin: false, has_purchased: true, refund_debt: 0, last_regen: new Date(Date.now() - 3600000).toISOString() }] }
        : { data: 0 },
      from: () => chain,
    }) };
  });
  await page.goto('./');
  await expect.poll(() => page.evaluate(() => Arcade.signedIn)).toBe(true);
  await expect.poll(() => page.evaluate(() => Arcade.tokens())).toBe(12); // 5 free + 7 purchased
  expect(await page.evaluate(() => Arcade.nextTokenIn())).toBeNull();
  expect(errors).toEqual([]);
});
