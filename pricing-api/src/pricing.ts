export type PricingQuote = {
  productId: string;
  userId: string;
  basePrice: number;
  discount: number;
  finalPrice: number;
  currency: string;
};

type LoyaltyTier = "BRONZE" | "SILVER" | "GOLD" | string;

// Central place for pricing rules
export function calculatePricing(
  productId: string,
  userId: string,
  basePrice: number,
  loyaltyTier: string
): PricingQuote {
  const normalizedTier = loyaltyTier.toUpperCase() as LoyaltyTier;

  let discountRate = 0;

  // Update rules here → UI + orchestrator will pick it up dynamically
  if (normalizedTier === "GOLD") {
    discountRate = 0.3; // 30%
  } else if (normalizedTier === "SILVER") {
    discountRate = 0.15; // 15%
  } else if (normalizedTier === "BRONZE") {
    discountRate = 0;
  }

  const discount = Math.round(basePrice * discountRate);
  const finalPrice = basePrice - discount;

  return {
    productId,
    userId,
    basePrice,
    discount,
    finalPrice,
    currency: "GBP"
  };
}