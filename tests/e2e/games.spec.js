// Every game boots and survives a few seconds of input with no script errors.
const { test, expect } = require('@playwright/test');
const { GAMES, prepare } = require('./helpers');

for (const slug of GAMES) {
  test(`${slug} starts and runs`, async ({ page }) => {
    const errors = await prepare(page);
    await page.goto(`./games/${slug}/?freeplay`);
    await page.waitForTimeout(400);
    await page.mouse.click(page.viewportSize().width / 2, page.viewportSize().height / 2);
    for (const key of ['Enter', ' ', 'ArrowRight', 'ArrowUp', 'z', 'ArrowLeft', 'Enter', ' ', 'ArrowDown', 'x']) {
      await page.keyboard.down(key); await page.waitForTimeout(120); await page.keyboard.up(key);
    }
    await page.waitForTimeout(1500);
    await expect(page.locator('a[href="../../"]').first()).toBeAttached();
    expect(errors, `script errors in ${slug}`).toEqual([]);
  });
}
