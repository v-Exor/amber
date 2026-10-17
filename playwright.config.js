import { defineConfig, devices } from '@playwright/test';
const deployedBase = process.env.LAB_BASE_URL;
export default defineConfig({
  testDir: './tests', testMatch: '**/*.spec.js', fullyParallel: false,
  workers: 1, timeout: 60000, reporter: 'list',
  use: { baseURL: deployedBase || 'http://127.0.0.1:4173/lab-01/', trace: 'retain-on-failure', screenshot: 'only-on-failure', launchOptions: { channel: 'chrome' } },
  projects: [{ name: 'desktop-chrome', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } }],
  webServer: deployedBase ? undefined : { command: 'node scripts/serve.mjs', url: 'http://127.0.0.1:4173/lab-01/', reuseExistingServer: true, timeout: 15000 },
});
