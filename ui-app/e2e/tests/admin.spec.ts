// Admin CRUD tests
// NOTE: These tests run in REAL mode (not mock mode) because Mockoon is static
// and doesn't persist state changes. Real APIs are required for CRUD operations.
//
// In CI: Real APIs (inventory-api, user-api, pricing-api) are started before these tests.
// In local: Run `npm run dev:all` to start all real APIs before running real-mode tests.

import { test, expect } from '@playwright/test';
import { Header } from '../pages/Header';
import { AdminPage } from '../pages/AdminPage';
import { generateUniqueId } from '../fixtures/testData';
import type { Product } from '../pages/AdminProductsSection';
import type { PricingRule } from '../pages/AdminPricingRulesSection';

test.describe('Admin CRUD Operations', () => {
  let header: Header;
  let adminPage: AdminPage;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    header = new Header(page);
    await header.navigateToAdmin();
    adminPage = new AdminPage(page);
  });

  test.describe('Users CRUD', () => {
    test('create user', async ({ page }) => {
      const userId = generateUniqueId('u-e2e');
      const user = {
        id: userId,
        name: 'E2E Test User',
        loyaltyTier: 'GOLD' as const,
      };

      await adminPage.usersSection.createUser(user);

      // Wait for network request to complete
      await page.waitForLoadState('networkidle');

      // Wait for the user row to appear in the table
      // useResourceCRUD's onSuccess (reloadUsers) should trigger a refetch
      // Retry checking for the user to appear (with timeout)
      let createdUser: { name: string; loyaltyTier: string } | null = null;
      for (let i = 0; i < 15; i++) {
        await page.waitForTimeout(300);
        createdUser = await adminPage.usersSection.getUser(userId);
        if (createdUser) break;
      }

      // Verify user appears in list (real API persists state)
      expect(createdUser).not.toBeNull();
      if (createdUser) {
        expect(createdUser.name).toBe(user.name);
        expect(createdUser.loyaltyTier).toBe(user.loyaltyTier);
      }

      // Cleanup
      if (createdUser) {
        await adminPage.usersSection.deleteUser(userId);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
      }
    });

    test('update user', async ({ page }) => {
      // Create user first
      const userId = generateUniqueId('u-e2e');
      await adminPage.usersSection.createUser({
        id: userId,
        name: 'Original Name',
        loyaltyTier: 'BRONZE',
      });

      // Wait for network request to complete
      await page.waitForLoadState('networkidle');

      // Wait for the user row to appear in the table before attempting update
      // Retry checking for the user to appear (with timeout)
      let userVisible = false;
      for (let i = 0; i < 15; i++) {
        await page.waitForTimeout(300);
        userVisible = await adminPage.usersSection.isUserVisible(userId);
        if (userVisible) break;
      }
      expect(userVisible).toBe(true);

      // Update user
      await adminPage.usersSection.updateUser(userId, {
        name: 'Updated Name',
        loyaltyTier: 'SILVER',
      });

      // Wait for network request to complete after update
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Verify update (real API persists state)
      const updatedUser = await adminPage.usersSection.getUser(userId);
      expect(updatedUser?.name).toBe('Updated Name');
      expect(updatedUser?.loyaltyTier).toBe('SILVER');

      // Cleanup
      await adminPage.usersSection.deleteUser(userId);
    });

    test('delete user', async ({ page }) => {
      // Create user first
      const userId = generateUniqueId('u-e2e');
      await adminPage.usersSection.createUser({
        id: userId,
        name: 'To Be Deleted',
        loyaltyTier: 'BRONZE',
      });

      // Verify exists
      expect(await adminPage.usersSection.isUserVisible(userId)).toBe(true);

      // Delete
      await adminPage.usersSection.deleteUser(userId);

      // Verify deleted (real API removes from state)
      await page.waitForTimeout(1000); // Wait for UI update
      expect(await adminPage.usersSection.isUserVisible(userId)).toBe(false);
    });
  });

  test.describe('Products CRUD', () => {
    test('create product', async ({ page }) => {
      const productId = generateUniqueId('p-e2e');
      const product = {
        id: productId,
        name: 'E2E Test Product',
        stock: 50,
        price: 99.99,
      };

      await adminPage.productsSection.createProduct(product);

      // Wait for network request to complete
      await page.waitForLoadState('networkidle');

      // Wait for the product row to appear in the table
      // Retry checking for the product to appear (with timeout)
      let createdProduct: Product | null = null;
      for (let i = 0; i < 20; i++) {
        await page.waitForTimeout(300);
        createdProduct = await adminPage.productsSection.getProduct(productId);
        if (createdProduct) break;
      }

      // Verify product appears in list (real API persists state)
      // TypeScript type narrowing: check first, then use
      if (!createdProduct) {
        throw new Error('Product was not created');
      }
      // After the if check, TypeScript knows createdProduct is not null
      expect(createdProduct).not.toBeNull(); // Redundant but explicit assertion
      expect(createdProduct.name).toBe(product.name);
      expect(createdProduct.stock).toBe(product.stock);
      expect(createdProduct.price).toBe(product.price);

      // Cleanup
      await adminPage.productsSection.deleteProduct(productId);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    });

    test('update product', async ({ page }) => {
      // Create product first
      const productId = generateUniqueId('p-e2e');
      await adminPage.productsSection.createProduct({
        id: productId,
        name: 'Original Product',
        stock: 10,
        price: 50,
      });

      // Wait for network request to complete
      await page.waitForLoadState('networkidle');

      // Wait for the product row to appear in the table before attempting update
      let productVisible = false;
      for (let i = 0; i < 15; i++) {
        await page.waitForTimeout(300);
        productVisible = await adminPage.productsSection.isProductVisible(productId);
        if (productVisible) break;
      }
      expect(productVisible).toBe(true);

      // Update product
      await adminPage.productsSection.updateProduct(productId, {
        name: 'Updated Product',
        stock: 20,
        price: 75,
      });

      // Wait for network request to complete after update
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Verify update (real API persists state)
      const updatedProduct = await adminPage.productsSection.getProduct(productId);
      expect(updatedProduct?.name).toBe('Updated Product');
      expect(updatedProduct?.stock).toBe(20);
      expect(updatedProduct?.price).toBe(75);

      // Cleanup
      await adminPage.productsSection.deleteProduct(productId);
    });

    test('delete product', async ({ page }) => {
      // Create product first
      const productId = generateUniqueId('p-e2e');
      await adminPage.productsSection.createProduct({
        id: productId,
        name: 'To Be Deleted',
        stock: 5,
        price: 25,
      });

      // Verify exists
      expect(await adminPage.productsSection.isProductVisible(productId)).toBe(true);

      // Delete
      await adminPage.productsSection.deleteProduct(productId);

      // Verify deleted (real API removes from state)
      await page.waitForTimeout(1000);
      expect(await adminPage.productsSection.isProductVisible(productId)).toBe(false);
    });
  });

  test.describe('Pricing Rules CRUD', () => {
    test('create pricing rule', async ({ page }) => {
      const ruleId = generateUniqueId('rule-e2e');
      const rule = {
        id: ruleId,
        loyaltyTier: 'GOLD' as const,
        rate: 0.25,
        description: 'E2E Test Rule',
        active: true,
      };

      await adminPage.pricingRulesSection.createRule(rule);

      // Wait for network request to complete
      await page.waitForLoadState('networkidle');

      // Wait for the rule row to appear in the table
      // Retry checking for the rule to appear (with timeout)
      let createdRule: PricingRule | null = null;
      for (let i = 0; i < 20; i++) {
        await page.waitForTimeout(300);
        createdRule = await adminPage.pricingRulesSection.getRule(ruleId);
        if (createdRule) break;
      }

      // Verify rule appears in list (real API persists state)
      // TypeScript type narrowing: check first, then use
      if (!createdRule) {
        throw new Error('Rule was not created');
      }
      // After the if check, TypeScript knows createdRule is not null
      expect(createdRule).not.toBeNull(); // Redundant but explicit assertion
      expect(createdRule.loyaltyTier).toBe(rule.loyaltyTier);
      expect(createdRule.rate).toBe(rule.rate);
      expect(createdRule.active).toBe(rule.active);

      // Cleanup
      await adminPage.pricingRulesSection.deleteRule(ruleId);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    });

    test('update pricing rule', async ({ page }) => {
      // Create rule first
      const ruleId = generateUniqueId('rule-e2e');
      await adminPage.pricingRulesSection.createRule({
        id: ruleId,
        loyaltyTier: 'BRONZE',
        rate: 0.1,
        description: 'Original Rule',
        active: true,
      });

      // Wait for network request to complete
      await page.waitForLoadState('networkidle');

      // Wait for the rule row to appear in the table before attempting update
      let ruleVisible = false;
      for (let i = 0; i < 15; i++) {
        await page.waitForTimeout(300);
        ruleVisible = await adminPage.pricingRulesSection.isRuleVisible(ruleId);
        if (ruleVisible) break;
      }
      expect(ruleVisible).toBe(true);

      // Update rule - Admin asks for all fields sequentially
      await adminPage.pricingRulesSection.updateRule(ruleId, {
        loyaltyTier: 'BRONZE', // Keep same
        rate: 0.15, // Update rate
        description: 'Updated Rule',
        active: true, // Keep active
      });

      // Wait for network request to complete after update
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Verify update (real API persists state)
      const updatedRule = await adminPage.pricingRulesSection.getRule(ruleId);
      expect(updatedRule?.rate).toBe(0.15);
      expect(updatedRule?.description).toBe('Updated Rule');

      // Cleanup
      await adminPage.pricingRulesSection.deleteRule(ruleId);
    });

    test('delete pricing rule', async ({ page }) => {
      // Create rule first
      const ruleId = generateUniqueId('rule-e2e');
      await adminPage.pricingRulesSection.createRule({
        id: ruleId,
        loyaltyTier: 'SILVER',
        rate: 0.2,
        description: 'To Be Deleted',
        active: true,
      });

      // Verify exists
      expect(await adminPage.pricingRulesSection.isRuleVisible(ruleId)).toBe(true);

      // Delete
      await adminPage.pricingRulesSection.deleteRule(ruleId);

      // Verify deleted (real API removes from state)
      await page.waitForTimeout(1000);
      expect(await adminPage.pricingRulesSection.isRuleVisible(ruleId)).toBe(false);
    });
  });
});
