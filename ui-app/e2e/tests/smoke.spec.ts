// Smoke tests: App loads and mock mode is visible

import { test, expect } from '@playwright/test';
import { Header } from '../pages/Header';

test.describe('Smoke Tests', () => {
  test('app loads and displays correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check title
    await expect(page).toHaveTitle(/ContractForge/i);

    // Check main heading (header h1, not the overview page h1)
    await expect(page.locator('header h1')).toContainText('ContractForge');
  });

  test('mock mode banner is visible when in mock mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const header = new Header(page);
    const isVisible = await header.isMockModeVisible();

    // In CI/local with MOCK_MODE=true, banner should be visible
    expect(isVisible).toBe(true);

    if (isVisible) {
      await expect(header.mockModeBanner).toContainText('Mock Mode Enabled');
      await expect(header.mockModeBanner).toContainText('contract-generated mocks');
    }
  });

  test('navigation tabs are present and clickable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const header = new Header(page);

    // All tabs should be visible
    await expect(header.tabOverview).toBeVisible();
    await expect(header.tabCheckout).toBeVisible();
    await expect(header.tabAdmin).toBeVisible();

    // Tabs should be clickable
    await header.tabCheckout.click();
    await expect(page.locator('text=Checkout Preview')).toBeVisible();

    await header.tabAdmin.click();
    await expect(page.locator('text=Admin Console')).toBeVisible();

    await header.tabOverview.click();
    await expect(page.locator('h1:has-text("ContractForge System Overview")')).toBeVisible();
  });
});
