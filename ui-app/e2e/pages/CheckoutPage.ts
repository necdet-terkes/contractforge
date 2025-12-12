// Checkout page object

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export interface ProductCard {
  id: string;
  name: string;
  stock: number;
  basePrice: string;
  finalPrice?: string;
  discountPercent?: string;
  savedAmount?: string;
  inStock: boolean;
}

export class CheckoutPage extends BasePage {
  readonly userSelectButtons: Locator;
  readonly clearSelectionButton: Locator;
  readonly productCards: Locator;
  readonly selectedUserInfo: Locator;

  constructor(page: Page) {
    super(page);
    this.userSelectButtons = page.locator('[data-testid^="user-select-"]');
    this.clearSelectionButton = page.getByTestId('clear-user-selection');
    this.productCards = page.locator('[data-testid^="product-card-"]');
    this.selectedUserInfo = page.locator('text=Selected:');
  }

  async selectUser(userId: string) {
    await this.page.getByTestId(`user-select-${userId}`).click();
    await this.page.waitForLoadState('networkidle');
  }

  async clearUserSelection() {
    await this.clearSelectionButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  getProductCard(productId: string): Locator {
    return this.page.getByTestId(`product-card-${productId}`);
  }

  async getProductInfo(productId: string): Promise<ProductCard> {
    const card = this.getProductCard(productId);
    // Wait for card to be visible first
    await card.waitFor({ state: 'visible', timeout: 10000 });
    const name = (await card.locator('h3').textContent()) || '';
    const stockText = (await card.locator('text=/Stock: \\d+ units/').textContent()) || '';
    const stock = parseInt(stockText.match(/\d+/)?.[0] || '0', 10);
    const inStock = await card
      .locator('text=In Stock')
      .isVisible()
      .catch(() => false);

    // Check if there's a discounted price or base price
    const basePriceEl = card.locator('text=/£\\d+\\.\\d{2}/').first();
    const basePrice = (await basePriceEl.textContent()) || '';

    // Check for discounted price (second price element)
    const priceElements = card.locator('text=/£\\d+\\.\\d{2}/');
    const priceCount = await priceElements.count();
    let finalPrice: string | undefined;
    let discountPercent: string | undefined;
    let savedAmount: string | undefined;

    if (priceCount > 1) {
      // Has discount
      finalPrice = (await priceElements.nth(1).textContent()) || undefined;
      const discountBadge = card.locator('text=/\\d+% OFF/');
      if (await discountBadge.isVisible().catch(() => false)) {
        discountPercent = (await discountBadge.textContent()) || undefined;
      }
      const savedText = card.locator('text=/You save £\\d+\\.\\d{2}/');
      if (await savedText.isVisible().catch(() => false)) {
        savedAmount = (await savedText.textContent()) || undefined;
      }
    } else {
      finalPrice = basePrice;
    }

    return {
      id: productId,
      name: name.trim(),
      stock,
      basePrice,
      finalPrice,
      discountPercent,
      savedAmount,
      inStock,
    };
  }

  async getAllProductIds(): Promise<string[]> {
    const cards = await this.productCards.all();
    const ids: string[] = [];
    for (const card of cards) {
      const testId = await card.getAttribute('data-testid');
      if (testId) {
        const match = testId.match(/product-card-(.+)/);
        if (match) {
          ids.push(match[1]);
        }
      }
    }
    return ids;
  }

  async getUserIds(): Promise<string[]> {
    const buttons = await this.userSelectButtons.all();
    const ids: string[] = [];
    for (const button of buttons) {
      const testId = await button.getAttribute('data-testid');
      if (testId) {
        const match = testId.match(/user-select-(.+)/);
        if (match) {
          ids.push(match[1]);
        }
      }
    }
    return ids;
  }

  async waitForProductsLoaded() {
    // Wait for products to load - check if any product cards exist
    await this.page.waitForSelector('[data-testid^="product-card-"]', { timeout: 15000 });
  }

  async waitForUsersLoaded() {
    // Wait for users to load - check if any user select buttons exist
    await this.page.waitForSelector('[data-testid^="user-select-"]', { timeout: 15000 });
  }
}
