// src/types.ts

export type ProductPart = {
  id: string;
  name: string;
  stock: number;
  basePrice: number;
};

export type UserPart = {
  id: string;
  name: string;
  loyaltyTier: "BRONZE" | "SILVER" | "GOLD";
};

export type PricingPart = {
  productId: string;
  userId: string;
  basePrice: number;
  discount: number;
  finalPrice: number;
  currency: string;
};

export type DiscountRule = {
  id: string;
  loyaltyTier: "BRONZE" | "SILVER" | "GOLD";
  rate: number;
  description?: string;
  active: boolean;
};