// Custom assertions for E2E tests

import { expect } from '@playwright/test';

export async function expectPriceFormat(priceText: string) {
  expect(priceText).toMatch(/^£\d+\.\d{2}$/);
}

export async function expectDiscountVisible(
  basePrice: string,
  finalPrice: string,
  discountPercent?: string
) {
  expect(basePrice).toBeTruthy();
  expect(finalPrice).toBeTruthy();
  const base = parseFloat(basePrice.replace('£', ''));
  const final = parseFloat(finalPrice.replace('£', ''));
  expect(final).toBeLessThan(base);
  if (discountPercent) {
    expect(discountPercent).toMatch(/\d+% OFF/);
  }
}
