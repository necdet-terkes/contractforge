// pricing-api/src/pricing.ts

import { LoyaltyTier } from './discountRules';
import { findActiveRuleForTier } from './discountRuleRepository';

export type PricingQuote = {
  productId: string;
  userId: string;
  basePrice: number;
  discount: number;
  finalPrice: number;
  currency: string;
};

export async function calculatePricing(
  productId: string,
  userId: string,
  basePrice: number,
  loyaltyTier: LoyaltyTier
): Promise<PricingQuote> {
  const rule = await findActiveRuleForTier(loyaltyTier);

  const discountRate = rule?.rate ?? 0;
  const discount = Math.round(basePrice * discountRate);
  const finalPrice = basePrice - discount;

  return {
    productId,
    userId,
    basePrice,
    discount,
    finalPrice,
    currency: 'GBP',
  };
}
