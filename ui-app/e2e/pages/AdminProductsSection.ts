// Admin Products section page object

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export interface Product {
  id: string;
  name: string;
  stock: number;
  price: number;
}

export class AdminProductsSection extends BasePage {
  readonly createForm: Locator;
  readonly idInput: Locator;
  readonly nameInput: Locator;
  readonly stockInput: Locator;
  readonly priceInput: Locator;
  readonly createButton: Locator;
  readonly tableRows: Locator;

  constructor(page: Page) {
    super(page);
    this.createForm = page.getByTestId('product-create-form');
    this.idInput = page.getByTestId('product-id-input');
    this.nameInput = page.getByTestId('product-name-input');
    this.stockInput = page.getByTestId('product-stock-input');
    this.priceInput = page.getByTestId('product-price-input');
    this.createButton = page.getByTestId('product-create-button');
    this.tableRows = page.locator('[data-testid^="table-row-"]');
  }

  async createProduct(product: Product) {
    await this.idInput.fill(product.id);
    await this.nameInput.fill(product.name);
    await this.stockInput.fill(String(product.stock));
    await this.priceInput.fill(String(product.price));
    await this.createButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  getProductRow(productId: string): Locator {
    return this.page.getByTestId(`table-row-${productId}`);
  }

  async getProduct(productId: string): Promise<Product | null> {
    const row = this.getProductRow(productId);
    if (!(await row.isVisible())) {
      return null;
    }

    const cells = row.locator('td');
    const id = (await cells.nth(0).textContent()) || '';
    const name = (await cells.nth(1).textContent()) || '';
    const stockText = (await cells.nth(2).textContent()) || '';
    const priceText = (await cells.nth(3).textContent()) || '';

    const stock = parseInt(stockText.trim(), 10);
    const price = parseFloat(priceText.replace('£', '').trim());

    return {
      id: id.trim(),
      name: name.trim(),
      stock,
      price,
    };
  }

  async updateProduct(
    productId: string,
    updates: { name?: string; stock?: number; price?: number }
  ) {
    // Wait for product to be visible before attempting to update
    // This is important when navigating back from other pages
    let currentProduct: Product | null = null;
    for (let i = 0; i < 20; i++) {
      await this.page.waitForTimeout(300);
      currentProduct = await this.getProduct(productId);
      if (currentProduct) break;
    }

    if (!currentProduct) {
      throw new Error(`Product ${productId} not found`);
    }

    // Click edit button to enter edit mode
    const editButton = this.page.getByTestId(`product-edit-${productId}`);
    await editButton.click();
    await this.page.waitForTimeout(200); // Wait for edit mode to activate

    // Fill in the form fields
    if (updates.name !== undefined) {
      const nameInput = this.page.getByTestId(`product-edit-name-${productId}`);
      await nameInput.fill(updates.name);
    }

    if (updates.stock !== undefined) {
      const stockInput = this.page.getByTestId(`product-edit-stock-${productId}`);
      await stockInput.fill(String(updates.stock));
    }

    if (updates.price !== undefined) {
      const priceInput = this.page.getByTestId(`product-edit-price-${productId}`);
      await priceInput.fill(String(updates.price));
    }

    // Click save button
    const saveButton = this.page.getByTestId(`product-save-${productId}`);
    await saveButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async deleteProduct(productId: string) {
    const deleteButton = this.page.getByTestId(`product-delete-${productId}`);
    await deleteButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async isProductVisible(productId: string): Promise<boolean> {
    const row = this.getProductRow(productId);
    return await row.isVisible();
  }

  async getAllProductIds(): Promise<string[]> {
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
