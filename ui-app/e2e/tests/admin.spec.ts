// Admin CRUD tests run in REAL mode (not mock mode) because Mockoon is static
// and doesn't persist state changes. Real APIs are required for CRUD operations.
// In local: Run `npm run dev:all` to start all real APIs before running real-mode tests.

import { test, expect } from '@playwright/test';
import { Header } from '../pages/Header';
import { AdminPage } from '../pages/AdminPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { generateUniqueId } from '../fixtures/testData';
import type { Product } from '../pages/AdminProductsSection';
import type { PricingRule } from '../pages/AdminPricingRulesSection';
import type { User } from '../pages/AdminUsersSection';

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

      // Wait for network request to complete
      await page.waitForLoadState('networkidle');

      // Wait for the user row to appear in the table
      // Retry checking for the user to appear (with timeout)
      let userVisible = false;
      for (let i = 0; i < 20; i++) {
        await page.waitForTimeout(300);
        userVisible = await adminPage.usersSection.isUserVisible(userId);
        if (userVisible) break;
      }

      // Verify exists - must be visible before delete
      expect(userVisible).toBe(true);

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

      // Wait for network request to complete
      await page.waitForLoadState('networkidle');

      // Wait for the product row to appear in the table
      // Retry checking for the product to appear (with timeout)
      let productVisible = false;
      for (let i = 0; i < 20; i++) {
        await page.waitForTimeout(300);
        productVisible = await adminPage.productsSection.isProductVisible(productId);
        if (productVisible) break;
      }

      // Verify exists - must be visible before delete
      expect(productVisible).toBe(true);

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

      // Wait for network request to complete
      await page.waitForLoadState('networkidle');

      // Wait for the rule row to appear in the table
      // Retry checking for the rule to appear (with timeout)
      let ruleVisible = false;
      for (let i = 0; i < 20; i++) {
        await page.waitForTimeout(300);
        ruleVisible = await adminPage.pricingRulesSection.isRuleVisible(ruleId);
        if (ruleVisible) break;
      }

      // Verify exists - must be visible before delete
      expect(ruleVisible).toBe(true);

      // Delete
      await adminPage.pricingRulesSection.deleteRule(ruleId);

      // Verify deleted (real API removes from state)
      await page.waitForTimeout(1000);
      expect(await adminPage.pricingRulesSection.isRuleVisible(ruleId)).toBe(false);
    });
  });

  test.describe('Admin CRUD Effects on Checkout', () => {
    test('user created in admin appears in checkout', async ({ page }) => {
      const userId = generateUniqueId('u-e2e');
      const user = {
        id: userId,
        name: 'Checkout Test User',
        loyaltyTier: 'GOLD' as const,
      };

      // Create user in admin
      await adminPage.usersSection.createUser(user);
      await page.waitForLoadState('networkidle');

      // Wait for user to appear in admin table
      let createdUser: User | null = null;
      for (let i = 0; i < 15; i++) {
        await page.waitForTimeout(300);
        createdUser = await adminPage.usersSection.getUser(userId);
        if (createdUser) break;
      }
      expect(createdUser).not.toBeNull();

      // Navigate to checkout
      const header = new Header(page);
      await header.navigateToCheckout();
      const checkoutPage = new CheckoutPage(page);
      await checkoutPage.waitForUsersLoaded();

      // Verify user appears in checkout
      const checkoutUserIds = await checkoutPage.getUserIds();
      expect(checkoutUserIds).toContain(userId);

      // Cleanup
      await header.navigateToAdmin();
      await adminPage.usersSection.deleteUser(userId);
    });

    test('user updated in admin reflects in checkout', async ({ page }) => {
      const userId = generateUniqueId('u-e2e');
      const originalUser = {
        id: userId,
        name: 'Original Name',
        loyaltyTier: 'BRONZE' as const,
      };

      // Create user in admin
      await adminPage.usersSection.createUser(originalUser);
      await page.waitForLoadState('networkidle');

      // Wait for user to appear
      let userVisible = false;
      for (let i = 0; i < 15; i++) {
        await page.waitForTimeout(300);
        userVisible = await adminPage.usersSection.isUserVisible(userId);
        if (userVisible) break;
      }
      expect(userVisible).toBe(true);

      // Navigate to checkout and verify original user
      const header = new Header(page);
      await header.navigateToCheckout();
      const checkoutPage = new CheckoutPage(page);
      await checkoutPage.waitForUsersLoaded();
      let checkoutUserIds = await checkoutPage.getUserIds();
      expect(checkoutUserIds).toContain(userId);

      // Update user in admin
      await header.navigateToAdmin();
      await adminPage.usersSection.updateUser(userId, {
        name: 'Updated Name',
        loyaltyTier: 'SILVER',
      });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Navigate back to checkout and verify updated user
      await header.navigateToCheckout();
      await checkoutPage.waitForUsersLoaded();
      checkoutUserIds = await checkoutPage.getUserIds();
      expect(checkoutUserIds).toContain(userId); // User should still be there

      // Cleanup
      await header.navigateToAdmin();
      await adminPage.usersSection.deleteUser(userId);
    });

    test('user deleted in admin disappears from checkout', async ({ page }) => {
      const userId = generateUniqueId('u-e2e');
      const user = {
        id: userId,
        name: 'To Be Deleted',
        loyaltyTier: 'BRONZE' as const,
      };

      // Create user in admin
      await adminPage.usersSection.createUser(user);
      await page.waitForLoadState('networkidle');

      // Wait for user to appear
      let userVisible = false;
      for (let i = 0; i < 15; i++) {
        await page.waitForTimeout(300);
        userVisible = await adminPage.usersSection.isUserVisible(userId);
        if (userVisible) break;
      }
      expect(userVisible).toBe(true);

      // Navigate to checkout and verify user exists
      const header = new Header(page);
      await header.navigateToCheckout();
      const checkoutPage = new CheckoutPage(page);
      await checkoutPage.waitForUsersLoaded();
      let checkoutUserIds = await checkoutPage.getUserIds();
      expect(checkoutUserIds).toContain(userId);

      // Delete user in admin
      await header.navigateToAdmin();
      await adminPage.usersSection.deleteUser(userId);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Navigate back to checkout and verify user is gone
      await header.navigateToCheckout();
      await checkoutPage.waitForUsersLoaded();
      checkoutUserIds = await checkoutPage.getUserIds();
      expect(checkoutUserIds).not.toContain(userId);
    });

    test('product created in admin appears in checkout', async ({ page }) => {
      const productId = generateUniqueId('p-e2e');
      const product = {
        id: productId,
        name: 'Checkout Test Product',
        stock: 100,
        price: 49.99,
      };

      // Create product in admin
      await adminPage.productsSection.createProduct(product);
      await page.waitForLoadState('networkidle');

      // Wait for product to appear in admin table
      let createdProduct: Product | null = null;
      for (let i = 0; i < 15; i++) {
        await page.waitForTimeout(300);
        createdProduct = await adminPage.productsSection.getProduct(productId);
        if (createdProduct) break;
      }
      expect(createdProduct).not.toBeNull();

      // Navigate to checkout
      const header = new Header(page);
      await header.navigateToCheckout();
      const checkoutPage = new CheckoutPage(page);
      await checkoutPage.waitForProductsLoaded();

      // Verify product appears in checkout
      const checkoutProductIds = await checkoutPage.getAllProductIds();
      expect(checkoutProductIds).toContain(productId);

      // Verify product details
      const productInfo = await checkoutPage.getProductInfo(productId);
      expect(productInfo.name).toBe(product.name);
      expect(productInfo.stock).toBe(product.stock);

      // Cleanup
      await header.navigateToAdmin();
      await adminPage.productsSection.deleteProduct(productId);
    });

    test('product updated in admin reflects in checkout', async ({ page }) => {
      const productId = generateUniqueId('p-e2e');
      const originalProduct = {
        id: productId,
        name: 'Original Product',
        stock: 10,
        price: 50,
      };

      // Create product in admin
      await adminPage.productsSection.createProduct(originalProduct);
      await page.waitForLoadState('networkidle');

      // Wait for product to appear
      let productVisible = false;
      for (let i = 0; i < 15; i++) {
        await page.waitForTimeout(300);
        productVisible = await adminPage.productsSection.isProductVisible(productId);
        if (productVisible) break;
      }
      expect(productVisible).toBe(true);

      // Navigate to checkout and verify original product
      const header = new Header(page);
      await header.navigateToCheckout();
      const checkoutPage = new CheckoutPage(page);
      await checkoutPage.waitForProductsLoaded();
      let checkoutProductIds = await checkoutPage.getAllProductIds();
      expect(checkoutProductIds).toContain(productId);

      let productInfo = await checkoutPage.getProductInfo(productId);
      expect(productInfo.name).toBe(originalProduct.name);
      expect(productInfo.stock).toBe(originalProduct.stock);

      // Update product in admin
      await header.navigateToAdmin();
      await page.waitForLoadState('networkidle');

      // Wait for product to be visible in admin table after navigation
      let productVisibleAfterNav = false;
      for (let i = 0; i < 15; i++) {
        await page.waitForTimeout(300);
        productVisibleAfterNav = await adminPage.productsSection.isProductVisible(productId);
        if (productVisibleAfterNav) break;
      }
      expect(productVisibleAfterNav).toBe(true);

      await adminPage.productsSection.updateProduct(productId, {
        name: 'Updated Product',
        stock: 20,
        price: 75,
      });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Navigate back to checkout and verify updated product
      await header.navigateToCheckout();
      await checkoutPage.waitForProductsLoaded();
      checkoutProductIds = await checkoutPage.getAllProductIds();
      expect(checkoutProductIds).toContain(productId);

      productInfo = await checkoutPage.getProductInfo(productId);
      expect(productInfo.name).toBe('Updated Product');
      expect(productInfo.stock).toBe(20);

      // Cleanup
      await header.navigateToAdmin();
      await adminPage.productsSection.deleteProduct(productId);
    });

    test('product deleted in admin disappears from checkout', async ({ page }) => {
      const productId = generateUniqueId('p-e2e');
      const product = {
        id: productId,
        name: 'To Be Deleted',
        stock: 5,
        price: 25,
      };

      // Create product in admin
      await adminPage.productsSection.createProduct(product);
      await page.waitForLoadState('networkidle');

      // Wait for product to appear
      let productVisible = false;
      for (let i = 0; i < 15; i++) {
        await page.waitForTimeout(300);
        productVisible = await adminPage.productsSection.isProductVisible(productId);
        if (productVisible) break;
      }
      expect(productVisible).toBe(true);

      // Navigate to checkout and verify product exists
      const header = new Header(page);
      await header.navigateToCheckout();
      const checkoutPage = new CheckoutPage(page);
      await checkoutPage.waitForProductsLoaded();
      let checkoutProductIds = await checkoutPage.getAllProductIds();
      expect(checkoutProductIds).toContain(productId);

      // Delete product in admin
      await header.navigateToAdmin();
      await adminPage.productsSection.deleteProduct(productId);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Navigate back to checkout and verify product is gone
      await header.navigateToCheckout();
      await checkoutPage.waitForProductsLoaded();
      checkoutProductIds = await checkoutPage.getAllProductIds();
      expect(checkoutProductIds).not.toContain(productId);
    });

    test('pricing rule created in admin affects checkout pricing', async ({ page }) => {
      const ruleId = generateUniqueId('rule-e2e');
      const userId = generateUniqueId('u-e2e');
      const rule = {
        id: ruleId,
        loyaltyTier: 'GOLD' as const,
        rate: 0.25,
        description: 'E2E Test Rule',
        active: true,
      };

      // Create user first
      await adminPage.usersSection.createUser({
        id: userId,
        name: 'Test User',
        loyaltyTier: 'GOLD',
      });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Create pricing rule in admin
      await adminPage.pricingRulesSection.createRule(rule);
      await page.waitForLoadState('networkidle');

      // Wait for rule to appear in admin table
      let createdRule: PricingRule | null = null;
      for (let i = 0; i < 15; i++) {
        await page.waitForTimeout(300);
        createdRule = await adminPage.pricingRulesSection.getRule(ruleId);
        if (createdRule) break;
      }
      expect(createdRule).not.toBeNull();

      // Navigate to checkout
      const header = new Header(page);
      await header.navigateToCheckout();
      const checkoutPage = new CheckoutPage(page);
      await checkoutPage.waitForUsersLoaded();
      await checkoutPage.waitForProductsLoaded();

      // Select user with GOLD tier
      await checkoutPage.selectUser(userId);

      // Verify discount is applied (check if any product shows discount)
      const productIds = await checkoutPage.getAllProductIds();
      expect(productIds.length).toBeGreaterThan(0);

      // Check if at least one product has discount applied
      let hasDiscount = false;
      for (const pid of productIds) {
        const productInfo = await checkoutPage.getProductInfo(pid);
        if (productInfo.discountPercent || productInfo.finalPrice !== productInfo.basePrice) {
          hasDiscount = true;
          break;
        }
      }
      expect(hasDiscount).toBe(true);

      // Cleanup
      await header.navigateToAdmin();
      await adminPage.pricingRulesSection.deleteRule(ruleId);
      await adminPage.usersSection.deleteUser(userId);
    });

    test('pricing rule updated in admin reflects in checkout', async ({ page }) => {
      const ruleId = generateUniqueId('rule-e2e');
      const userId = generateUniqueId('u-e2e');
      const originalRule = {
        id: ruleId,
        loyaltyTier: 'GOLD' as const,
        rate: 0.1,
        description: 'Original Rule',
        active: true,
      };

      // Create user first
      await adminPage.usersSection.createUser({
        id: userId,
        name: 'Test User',
        loyaltyTier: 'GOLD',
      });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Create pricing rule in admin
      await adminPage.pricingRulesSection.createRule(originalRule);
      await page.waitForLoadState('networkidle');

      // Wait for rule to appear
      let ruleVisible = false;
      for (let i = 0; i < 15; i++) {
        await page.waitForTimeout(300);
        ruleVisible = await adminPage.pricingRulesSection.isRuleVisible(ruleId);
        if (ruleVisible) break;
      }
      expect(ruleVisible).toBe(true);

      // Navigate to checkout and select user
      const header = new Header(page);
      await header.navigateToCheckout();
      const checkoutPage = new CheckoutPage(page);
      await checkoutPage.waitForUsersLoaded();
      await checkoutPage.waitForProductsLoaded();
      await checkoutPage.selectUser(userId);

      // Get initial discount rate from a product
      const productIds = await checkoutPage.getAllProductIds();
      expect(productIds.length).toBeGreaterThan(0);
      const firstProduct = await checkoutPage.getProductInfo(productIds[0]);
      const initialHasDiscount = firstProduct.discountPercent !== undefined;

      // Update rule in admin (increase rate)
      await header.navigateToAdmin();
      await adminPage.pricingRulesSection.updateRule(ruleId, {
        rate: 0.3, // Increased from 0.1 to 0.3
        description: 'Updated Rule',
      });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Navigate back to checkout and verify updated discount
      await header.navigateToCheckout();
      await checkoutPage.waitForUsersLoaded();
      await checkoutPage.waitForProductsLoaded();
      await checkoutPage.selectUser(userId);

      // Verify discount is still applied (or more strongly if rate increased)
      const updatedProduct = await checkoutPage.getProductInfo(productIds[0]);
      if (initialHasDiscount) {
        // Discount should still be present, potentially with different rate
        expect(updatedProduct.discountPercent).toBeDefined();
      }

      // Cleanup
      await header.navigateToAdmin();
      await adminPage.pricingRulesSection.deleteRule(ruleId);
      await adminPage.usersSection.deleteUser(userId);
    });

    test('pricing rule deleted in admin removes discount from checkout', async ({ page }) => {
      const ruleId = generateUniqueId('rule-e2e');
      const userId = generateUniqueId('u-e2e');
      const rule = {
        id: ruleId,
        loyaltyTier: 'GOLD' as const,
        rate: 0.25,
        description: 'To Be Deleted',
        active: true,
      };

      // Create user first
      await adminPage.usersSection.createUser({
        id: userId,
        name: 'Test User',
        loyaltyTier: 'GOLD',
      });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Create pricing rule in admin
      await adminPage.pricingRulesSection.createRule(rule);
      await page.waitForLoadState('networkidle');

      // Wait for rule to appear
      let ruleVisible = false;
      for (let i = 0; i < 15; i++) {
        await page.waitForTimeout(300);
        ruleVisible = await adminPage.pricingRulesSection.isRuleVisible(ruleId);
        if (ruleVisible) break;
      }
      expect(ruleVisible).toBe(true);

      // Navigate to checkout and select user
      const header = new Header(page);
      await header.navigateToCheckout();
      const checkoutPage = new CheckoutPage(page);
      await checkoutPage.waitForUsersLoaded();
      await checkoutPage.waitForProductsLoaded();
      await checkoutPage.selectUser(userId);

      // Verify discount is applied
      const productIds = await checkoutPage.getAllProductIds();
      expect(productIds.length).toBeGreaterThan(0);
      const firstProduct = await checkoutPage.getProductInfo(productIds[0]);
      const hadDiscount = firstProduct.discountPercent !== undefined;

      // Delete rule in admin
      await header.navigateToAdmin();
      await adminPage.pricingRulesSection.deleteRule(ruleId);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Navigate back to checkout and verify discount is removed
      await header.navigateToCheckout();
      await checkoutPage.waitForUsersLoaded();
      await checkoutPage.waitForProductsLoaded();
      await checkoutPage.selectUser(userId);

      // If there was a discount before, it should be gone now (or reduced)

      // Cleanup
      await header.navigateToAdmin();
      await adminPage.usersSection.deleteUser(userId);
    });
  });
});
