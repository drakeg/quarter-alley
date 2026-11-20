// Browser tests. Locally: npm run e2e (starts a server on :4173).
// Against another server (e.g. Docker Compose): BASE_URL=http://localhost:8080 npm run e2e
const { defineConfig, devices } = require('@playwright/test');
const external = !!process.env.BASE_URL;
module.exports = defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: process.env.BASE_URL || 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  webServer: external ? undefined : {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1',
    url: 'http://127.0.0.1:4173/', reuseExistingServer: !process.env.CI, timeout: 20_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] }, testMatch: /site\.spec\.js/ },
  ],
});
