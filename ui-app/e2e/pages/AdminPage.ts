// Admin page object

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { AdminUsersSection } from './AdminUsersSection';
import { AdminProductsSection } from './AdminProductsSection';
import { AdminPricingRulesSection } from './AdminPricingRulesSection';

export class AdminPage extends BasePage {
  readonly usersSection: AdminUsersSection;
  readonly productsSection: AdminProductsSection;
  readonly pricingRulesSection: AdminPricingRulesSection;

  constructor(page: Page) {
    super(page);
    this.usersSection = new AdminUsersSection(page);
    this.productsSection = new AdminProductsSection(page);
    this.pricingRulesSection = new AdminPricingRulesSection(page);
  }
}
