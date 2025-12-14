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
    // Wait for user to be visible before attempting to update
    // This is important when navigating back from other pages
    let currentUser: User | null = null;
    for (let i = 0; i < 20; i++) {
      await this.page.waitForTimeout(300);
      currentUser = await this.getUser(userId);
      if (currentUser) break;
    }

    if (!currentUser) {
      throw new Error(`User ${userId} not found`);
    }

    // Click edit button to enter edit mode
    const editButton = this.page.getByTestId(`user-edit-${userId}`);
    await editButton.click();
    await this.page.waitForTimeout(200); // Wait for edit mode to activate

    // Fill in the form fields
    if (updates.name !== undefined) {
      const nameInput = this.page.getByTestId(`user-edit-name-${userId}`);
      await nameInput.fill(updates.name);
    }

    if (updates.loyaltyTier !== undefined) {
      const tierSelect = this.page.getByTestId(`user-edit-tier-${userId}`);
      await tierSelect.selectOption(updates.loyaltyTier);
    }

    // Click save button
    const saveButton = this.page.getByTestId(`user-save-${userId}`);
    await saveButton.click();
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
