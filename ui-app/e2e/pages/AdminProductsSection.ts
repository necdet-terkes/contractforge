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
    // Admin uses window.prompt for updates - Admin ALWAYS asks for all 3 fields: name, stock, price
    const editButton = this.page.getByTestId(`product-edit-${productId}`);

    // Get current product to preserve unchanged values
    const currentProduct = await this.getProduct(productId);

    // Set up dialog listeners BEFORE clicking the button
    const dialog1Promise = this.page.waitForEvent('dialog', { timeout: 15000 });
    const dialog2Promise = this.page.waitForEvent('dialog', { timeout: 15000 });
    const dialog3Promise = this.page.waitForEvent('dialog', { timeout: 15000 });

    // Click the edit button and wait for first dialog simultaneously
    // Use noWaitAfter to prevent click timeout when dialog opens immediately
    const [dialog1] = await Promise.all([
      dialog1Promise,
      editButton.click({ noWaitAfter: true }).catch(() => {
        // Click may fail if dialog opens immediately, but dialog promise will resolve
      }),
    ]);
    await dialog1.accept(updates.name || dialog1.defaultValue() || currentProduct?.name || '');

    // Small delay to allow JavaScript to process first dialog
    await this.page.waitForTimeout(100);

    // Handle second dialog (stock)
    const dialog2 = await dialog2Promise;
    await dialog2.accept(
      String(
        updates.stock !== undefined
          ? updates.stock
          : currentProduct?.stock || dialog2.defaultValue() || '0'
      )
    );

    // Small delay to allow JavaScript to process second dialog
    await this.page.waitForTimeout(100);

    // Handle third dialog (price)
    const dialog3 = await dialog3Promise;
    await dialog3.accept(
      String(
        updates.price !== undefined
          ? updates.price
          : currentProduct?.price || dialog3.defaultValue() || '0'
      )
    );

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
