import { defineConfig, devices } from '@playwright/test';
import  * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' }); // Load .env.test from root directory 

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000, // Each test has 30 seconds max (if it takes longer, it fails)
  expect: { timeout: 5000 },
  fullyParallel: false,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    baseURL: process.env.PW_BASE_URL || 'http://localhost:5173',   // All test URLs are relative to this (the dev server)
    headless: true, // Run without opening a visible browser window (faster)
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10_000, // Max time for each action (like click, fill) before it fails
    ignoreHTTPSErrors: true,

  
  },
  // Configure projects for major browsers and devices 
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }, // Test on desktop Chrome (headless)
  ],

  webServer: {
    command: 'npm run dev -- --mode test',
    url: 'http://localhost:5173',
    cwd: '.',
    reuseExistingServer: true,
  },
});
