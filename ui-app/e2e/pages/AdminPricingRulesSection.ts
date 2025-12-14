// Admin Pricing Rules section page object

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export interface PricingRule {
  id: string;
  loyaltyTier: 'BRONZE' | 'SILVER' | 'GOLD';
  rate: number;
  description?: string;
  active: boolean;
}

export class AdminPricingRulesSection extends BasePage {
  readonly createForm: Locator;
  readonly idInput: Locator;
  readonly tierSelect: Locator;
  readonly rateInput: Locator;
  readonly descriptionInput: Locator;
  readonly activeCheckbox: Locator;
  readonly createButton: Locator;
  readonly tableRows: Locator;

  constructor(page: Page) {
    super(page);
    this.createForm = page.getByTestId('rule-create-form');
    this.idInput = page.getByTestId('rule-id-input');
    this.tierSelect = page.getByTestId('rule-tier-select');
    this.rateInput = page.getByTestId('rule-rate-input');
    this.descriptionInput = page.getByTestId('rule-description-input');
    this.activeCheckbox = page.getByTestId('rule-active-checkbox');
    this.createButton = page.getByTestId('rule-create-button');
    this.tableRows = page.locator('[data-testid^="table-row-"]');
  }

  async createRule(rule: PricingRule) {
    await this.idInput.fill(rule.id);
    await this.tierSelect.selectOption(rule.loyaltyTier);
    await this.rateInput.fill(String(rule.rate));
    if (rule.description) {
      await this.descriptionInput.fill(rule.description);
    }
    if (rule.active) {
      await this.activeCheckbox.check();
    } else {
      await this.activeCheckbox.uncheck();
    }
    await this.createButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  getRuleRow(ruleId: string): Locator {
    return this.page.getByTestId(`table-row-${ruleId}`);
  }

  async getRule(ruleId: string): Promise<PricingRule | null> {
    const row = this.getRuleRow(ruleId);
    if (!(await row.isVisible())) {
      return null;
    }

    const cells = row.locator('td');
    const id = (await cells.nth(0).textContent()) || '';
    const tier = ((await cells.nth(1).textContent()) || '') as PricingRule['loyaltyTier'];
    const rateText = (await cells.nth(2).textContent()) || '';
    const description = (await cells.nth(3).textContent()) || '';
    const activeText = (await cells.nth(4).textContent()) || '';

    const rate = parseFloat(rateText.trim());
    const active = activeText.trim() === '✅';

    return {
      id: id.trim(),
      loyaltyTier: tier.trim() as PricingRule['loyaltyTier'],
      rate,
      description: description.trim() === '-' ? undefined : description.trim(),
      active,
    };
  }

  async updateRule(ruleId: string, updates: Partial<PricingRule>) {
    // Wait for rule to be visible before attempting to update
    // This is important when navigating back from other pages
    let currentRule: PricingRule | null = null;
    for (let i = 0; i < 20; i++) {
      await this.page.waitForTimeout(300);
      currentRule = await this.getRule(ruleId);
      if (currentRule) break;
    }

    if (!currentRule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    // Click edit button to enter edit mode
    const editButton = this.page.getByTestId(`rule-edit-${ruleId}`);
    await editButton.click();
    await this.page.waitForTimeout(200); // Wait for edit mode to activate

    // Fill in the form fields
    if (updates.loyaltyTier !== undefined) {
      const tierSelect = this.page.getByTestId(`rule-edit-tier-${ruleId}`);
      await tierSelect.selectOption(updates.loyaltyTier);
    }

    if (updates.rate !== undefined) {
      const rateInput = this.page.getByTestId(`rule-edit-rate-${ruleId}`);
      await rateInput.fill(String(updates.rate));
    }

    if (updates.description !== undefined) {
      const descriptionInput = this.page.getByTestId(`rule-edit-description-${ruleId}`);
      await descriptionInput.fill(updates.description);
    }

    if (updates.active !== undefined) {
      const activeCheckbox = this.page.getByTestId(`rule-edit-active-${ruleId}`);
      if (updates.active) {
        await activeCheckbox.check();
      } else {
        await activeCheckbox.uncheck();
      }
    }

    // Click save button
    const saveButton = this.page.getByTestId(`rule-save-${ruleId}`);
    await saveButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async deleteRule(ruleId: string) {
    const deleteButton = this.page.getByTestId(`rule-delete-${ruleId}`);
    await deleteButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async isRuleVisible(ruleId: string): Promise<boolean> {
    const row = this.getRuleRow(ruleId);
    return await row.isVisible();
  }

  async getAllRuleIds(): Promise<string[]> {
    const rows = await this.tableRows.all();
    const ids: string[] = [];
    for (const row of rows) {
      const testId = await row.getAttribute('data-testid');
      if (testId) {
        const match = testId.match(/table-row-(.+)/);
        if (match) {
          ids.push(match[1]);
        }
      }
    }
    return ids;
  }
}
