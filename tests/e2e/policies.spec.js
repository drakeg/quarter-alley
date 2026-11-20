const { test, expect } = require('@playwright/test');
const { prepare } = require('./helpers');

for (const [path, heading] of [['legal/terms/', 'Terms of Use'], ['legal/privacy/', 'Privacy Policy'], ['legal/refunds/', 'Refund Policy'], ['contact/', 'Contact us']]) {
  test(`${path} loads with the toolbar and policy links`, async ({ page }) => {
    const errors = await prepare(page);
    await page.goto('./' + path);
    await expect(page.locator('h1')).toHaveText(heading);
    await expect(page.locator('.qa-chip').first()).toBeVisible();                  // shared toolbar mounted
    await expect(page.locator('nav[aria-label="Policies"] a')).toHaveCount(4);
    await page.locator('a.back').click();                                          // root path resolves from two levels deep
    await expect(page.locator('#cabinets')).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('home page footer links every policy', async ({ page }) => {
  await prepare(page);
  await page.goto('./');
  for (const name of ['Terms of use', 'Privacy', 'Refunds', 'Contact']) {
    await expect(page.locator('footer').getByRole('link', { name, exact: true })).toBeVisible();
  }
});

test('contact form validates and fails politely when offline', async ({ page }) => {
  const errors = await prepare(page);
  await page.goto('./contact/?topic=purchase');
  await expect(page.locator('select[name=topic]')).toHaveValue('purchase');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.locator('#msg')).toHaveText(/enter your name/i);
  await page.fill('input[name=name]', 'Pat');
  await page.fill('input[name=email]', 'not-an-email');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.locator('#msg')).toHaveText(/doesn't look right/);
  await page.fill('input[name=email]', 'pat@example.com');
  await page.fill('textarea[name=body]', 'Short');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.locator('#msg')).toHaveText(/more detail/);
  await page.fill('textarea[name=body]', 'My tokens did not arrive after buying a roll.');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.locator('#msg')).toHaveText(/can't be sent right now/);    // Supabase is blocked in tests
  expect(errors).toEqual([]);
});

test('contact form sends to the inbox', async ({ page }) => {
  await prepare(page);
  let sent = null;
  await page.route(/\/rest\/v1\/rpc\/send_message/, async (r) => { sent = r.request().postDataJSON(); await r.fulfill({ status: 204, body: '' }); });
  await page.goto('./contact/');
  await page.fill('input[name=name]', 'Pat');
  await page.fill('input[name=email]', 'pat@example.com');
  await page.selectOption('select[name=topic]', 'business');
  await page.fill('textarea[name=body]', 'We run a campground and want to sponsor a billboard.');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.locator('#msg')).toHaveText(/message was sent/);
  expect(sent).toMatchObject({ p_name: 'Pat', p_email: 'pat@example.com', p_topic: 'business', p_page: '/contact/' });
});
