// Header component page object

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class Header extends BasePage {
  readonly mockModeBanner: Locator;
  readonly tabOverview: Locator;
  readonly tabCheckout: Locator;
  readonly tabAdmin: Locator;

  constructor(page: Page) {
    super(page);
    this.mockModeBanner = page.getByTestId('mock-mode-banner');
    this.tabOverview = page.getByTestId('tab-overview');
    this.tabCheckout = page.getByTestId('tab-checkout');
    this.tabAdmin = page.getByTestId('tab-admin');
  }

  async navigateToCheckout() {
    await this.tabCheckout.click();
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToAdmin() {
    await this.tabAdmin.click();
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToOverview() {
    await this.tabOverview.click();
    await this.page.waitForLoadState('networkidle');
  }

  async isMockModeVisible(): Promise<boolean> {
    return await this.mockModeBanner.isVisible();
  }
}
