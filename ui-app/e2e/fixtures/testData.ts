// Test data fixtures

export function generateUniqueId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
}

export const testUsers = {
  bronze: {
    id: 'u-test-bronze',
    name: 'Test Bronze User',
    loyaltyTier: 'BRONZE' as const,
  },
  silver: {
    id: 'u-test-silver',
    name: 'Test Silver User',
    loyaltyTier: 'SILVER' as const,
  },
  gold: {
    id: 'u-test-gold',
    name: 'Test Gold User',
    loyaltyTier: 'GOLD' as const,
  },
};

export const testProducts = {
  basic: {
    id: 'p-test-basic',
    name: 'Test Product',
    stock: 10,
    price: 100,
  },
  expensive: {
    id: 'p-test-expensive',
    name: 'Expensive Test Product',
    stock: 5,
    price: 1000,
  },
};

export const testRules = {
  bronze: {
    id: 'rule-test-bronze',
    loyaltyTier: 'BRONZE' as const,
    rate: 0.1,
    description: 'Test bronze rule',
    active: true,
  },
  gold: {
    id: 'rule-test-gold',
    loyaltyTier: 'GOLD' as const,
    rate: 0.3,
    description: 'Test gold rule',
    active: true,
  },
};
