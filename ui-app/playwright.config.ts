import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

// Get root directory (parent of ui-app)
// __dirname is ui-app directory, so go up one level to get project root
const rootDir = path.resolve(__dirname, '..');

// Mock mode is enabled by default for tests
// Real mode is used for admin CRUD tests (via project configuration)
const isMockMode = process.env.MOCK_MODE !== 'false';

export default defineConfig({
  testDir: './e2e/tests',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Use multiple workers in CI for faster test execution
  // Mock mode tests can run in parallel (static mocks, no state conflicts)
  // Real mode tests can also run in parallel (each test uses unique IDs)
  workers: process.env.CI ? 2 : undefined, // 2 workers in CI, auto-detect locally
  reporter: process.env.CI
    ? [
        ['github'],
        ['html', { outputFolder: 'playwright-report' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
      ]
    : [
        ['html', { outputFolder: 'playwright-report' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['list'],
      ],
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'mock-mode',
      testMatch: /.*\.(spec|test)\.ts/,
      testIgnore: /.*admin\.spec\.ts/, // Exclude admin CRUD tests from mock mode
      use: {
        ...devices['Desktop Chrome'],
      },
      // Mock mode tests can run in parallel - static mocks, no state conflicts
      // Each test uses unique IDs, so no race conditions
    },
    {
      name: 'real-mode',
      testMatch: /.*admin\.spec\.ts/, // Only admin CRUD tests in real mode
      use: {
        ...devices['Desktop Chrome'],
      },
      // Real mode: Real APIs must be started separately (npm run dev:all)
      // Real mode tests can run in parallel - each test uses unique IDs
    },
  ],
  webServer: [
    // Mockoon mocks must be started separately (npm run mocks:dev)
    // Playwright's webServer is not suitable for long-running processes like Mockoon CLI

    // Start orchestrator API (required for UI to work)
    // For mock-mode project: uses MOCK_MODE=true (points to mocks)
    // For real-mode project: uses real APIs (MOCK_MODE=false)
    {
      command: isMockMode
        ? 'cross-env MOCK_MODE=true npm run dev:orchestrator'
        : 'npm run dev:orchestrator',
      url: 'http://localhost:4000/health',
      reuseExistingServer: process.env.CI !== 'true',
      timeout: 120_000,
      cwd: path.resolve(rootDir),
    },
    // Start UI app
    // For mock-mode: shows mock banner
    // For real-mode: no mock banner
    {
      command: isMockMode
        ? 'cross-env VITE_MOCK_MODE=true npm run dev -- --host --port 5173'
        : 'npm run dev -- --host --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: process.env.CI !== 'true',
      timeout: 120_000,
      cwd: path.resolve(__dirname), // Run from ui-app directory (npm workspace)
    },
  ],
});
