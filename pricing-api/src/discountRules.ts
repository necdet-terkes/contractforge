// pricing-api/src/discountRules.ts

import { LoyaltyTier } from "../../types/loyaltyTier";

export type { LoyaltyTier };

export type DiscountRule = {
  id: string;
  loyaltyTier: LoyaltyTier;
  rate: number; // 0.3 = 30% discount
  description?: string;
  active: boolean;
};

// Initial in-memory seed rules
export const initialDiscountRules: DiscountRule[] = [
  {
    id: "rule-gold-default",
    loyaltyTier: "GOLD",
    rate: 0.3,
    description: "Base discount for GOLD customers",
    active: true
  },
  {
    id: "rule-silver-default",
    loyaltyTier: "SILVER",
    rate: 0.15,
    description: "Base discount for SILVER customers",
    active: true
  },
  {
    id: "rule-bronze-default",
    loyaltyTier: "BRONZE",
    rate: 0,
    description: "No default discount for BRONZE customers",
    active: true
  }
];