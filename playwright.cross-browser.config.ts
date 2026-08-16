import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,

  workers: 1,

  timeout: 45_000,

  grep: /@smoke/,

  reporter: [
    [
      'html',
      {
        outputFolder: 'playwright-report-cross-browser',
        open: 'never',
      },
    ],
    [
      'junit',
      {
        outputFile: 'test-results/cross-browser-junit.xml',
      },
    ],
  ],

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
