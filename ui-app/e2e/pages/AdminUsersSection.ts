// Admin Users section page object

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export interface User {
  id: string;
  name: string;
  loyaltyTier: 'BRONZE' | 'SILVER' | 'GOLD';
}

export class AdminUsersSection extends BasePage {
  readonly createForm: Locator;
  readonly idInput: Locator;
  readonly nameInput: Locator;
  readonly tierSelect: Locator;
  readonly createButton: Locator;
  readonly tableRows: Locator;

  constructor(page: Page) {
    super(page);
    this.createForm = page.getByTestId('user-create-form');
    this.idInput = page.getByTestId('user-id-input');
    this.nameInput = page.getByTestId('user-name-input');
    this.tierSelect = page.getByTestId('user-tier-select');
    this.createButton = page.getByTestId('user-create-button');
    this.tableRows = page.locator('[data-testid^="table-row-"]');
  }

  async createUser(user: User) {
    await this.idInput.fill(user.id);
    await this.nameInput.fill(user.name);
    await this.tierSelect.selectOption(user.loyaltyTier);
    await this.createButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  getUserRow(userId: string): Locator {
    return this.page.getByTestId(`table-row-${userId}`);
  }

  async getUser(userId: string): Promise<User | null> {
    const row = this.getUserRow(userId);
    if (!(await row.isVisible())) {
      return null;
    }

    const cells = row.locator('td');
    const id = (await cells.nth(0).textContent()) || '';
    const name = (await cells.nth(1).textContent()) || '';
    const tier = ((await cells.nth(2).textContent()) || '') as User['loyaltyTier'];

    return { id: id.trim(), name: name.trim(), loyaltyTier: tier.trim() as User['loyaltyTier'] };
  }

  async updateUser(userId: string, updates: { name?: string; loyaltyTier?: User['loyaltyTier'] }) {
    // Admin uses window.prompt for updates - dialogs appear sequentially
    // Admin ALWAYS asks for both name and loyaltyTier (see AdminView.tsx handleUpdateUser)
    const editButton = this.page.getByTestId(`user-edit-${userId}`);

    // Get current user to preserve unchanged values
    const currentUser = await this.getUser(userId);

    // Click and wait for first dialog (name) - Admin always asks
    await Promise.all([
      editButton.click(),
      this.page.waitForEvent('dialog', { timeout: 10000 }).then(async (dialog) => {
        await dialog.accept(updates.name || dialog.defaultValue() || currentUser?.name || '');
      }),
    ]);

    // Wait for second dialog (loyaltyTier) - Admin always asks
    const dialog2 = await this.page.waitForEvent('dialog', { timeout: 10000 });
    await dialog2.accept(
      updates.loyaltyTier || dialog2.defaultValue() || currentUser?.loyaltyTier || ''
    );

    await this.page.waitForLoadState('networkidle');
  }

  async deleteUser(userId: string) {
    const deleteButton = this.page.getByTestId(`user-delete-${userId}`);
    await deleteButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async isUserVisible(userId: string): Promise<boolean> {
    const row = this.getUserRow(userId);
    return await row.isVisible();
  }

  async getAllUserIds(): Promise<string[]> {
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
