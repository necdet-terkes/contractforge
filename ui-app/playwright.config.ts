import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

// Get root directory (parent of ui-app)
// __dirname is ui-app directory, so go up one level to get project root
const rootDir = path.resolve(__dirname, '..');

// Mock mode is enabled by default for tests
const isMockMode = process.env.MOCK_MODE !== 'false';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    // Note: Mockoon mocks must be started separately before running tests
    // In CI, mocks are started in a separate step (see .github/workflows/ci.yml)
    // For local development, run: npm run mocks:dev
    // Playwright's webServer is not suitable for long-running processes like Mockoon CLI
    // Start UI app
    {
      command: isMockMode
        ? 'cross-env VITE_MOCK_MODE=true npm run dev -- --host --port 5173'
        : 'npm run dev -- --host --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: process.env.CI !== 'true',
      timeout: 120_000,
    },
  ],
});
