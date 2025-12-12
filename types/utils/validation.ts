// Shared validation utilities used across services

import { LoyaltyTier } from '../loyaltyTier';

export function validateLoyaltyTier(tier: unknown): {
  valid: boolean;
  value?: LoyaltyTier;
  error?: { code: string; message: string };
} {
  const normalizedTier = String(tier).toUpperCase();

  if (!['BRONZE', 'SILVER', 'GOLD'].includes(normalizedTier)) {
    return {
      valid: false,
      error: {
        code: 'INVALID_TIER',
        message: 'loyaltyTier must be one of BRONZE, SILVER or GOLD',
      },
    };
  }

  return { valid: true, value: normalizedTier as LoyaltyTier };
}
