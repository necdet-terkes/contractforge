// pricing-api/src/utils/validation.ts

export function validateRate(rate: unknown): { valid: boolean; value?: number; error?: { code: string; message: string } } {
  const rateNumber = Number(rate);
  
  if (Number.isNaN(rateNumber) || rateNumber < 0 || rateNumber > 1) {
    return {
      valid: false,
      error: {
        code: "INVALID_RATE",
        message: "rate must be a number between 0 and 1"
      }
    };
  }
  
  return { valid: true, value: rateNumber };
}

export function validateBasePrice(basePrice: unknown): { valid: boolean; value?: number; error?: { code: string; message: string } } {
  const basePriceNumber = Number(basePrice);
  
  if (Number.isNaN(basePriceNumber) || basePriceNumber <= 0) {
    return {
      valid: false,
      error: {
        code: "INVALID_BASE_PRICE",
        message: "basePrice must be a positive number"
      }
    };
  }
  
  return { valid: true, value: basePriceNumber };
}

