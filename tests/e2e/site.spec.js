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
