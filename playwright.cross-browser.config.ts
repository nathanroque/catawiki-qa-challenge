import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,

  workers: 1,

  grep: /@smoke/,

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});