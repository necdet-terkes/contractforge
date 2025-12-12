import { PricingInfo } from './pricingClient';
import { LoyaltyTier } from '../../types/loyaltyTier';

export interface CheckoutProduct {
  id: string;
  name: string;
  stock: number;
  price: number;
}

export interface CheckoutUser {
  id: string;
  name: string;
  loyaltyTier: LoyaltyTier;
}

export interface CheckoutPreviewInput {
  product: CheckoutProduct;
  user: CheckoutUser;
  pricing: PricingInfo;
}

export function buildCheckoutPreview(input: CheckoutPreviewInput) {
  return {
    product: {
      id: input.product.id,
      name: input.product.name,
      stock: input.product.stock,
      basePrice: input.product.price,
    },
    user: {
      id: input.user.id,
      name: input.user.name,
      loyaltyTier: input.user.loyaltyTier,
    },
    pricing: input.pricing,
  };
}

export function mapCheckoutError(error: any): {
  code: string;
  status: number;
  message: string;
} {
  if (error?.code === 'PRODUCT_NOT_FOUND') {
    return { code: 'PRODUCT_NOT_FOUND', status: 404, message: error.message };
  }
  if (error?.code === 'USER_NOT_FOUND') {
    return { code: 'USER_NOT_FOUND', status: 404, message: error.message };
  }
  if (error?.code === 'PRICING_API_ERROR') {
    return { code: 'PRICING_API_ERROR', status: 502, message: error.message };
  }
  return {
    code: 'UPSTREAM_UNAVAILABLE',
    status: 502,
    message: 'Could not retrieve data from one or more upstream services',
  };
}
