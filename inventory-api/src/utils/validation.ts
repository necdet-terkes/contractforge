// inventory-api/src/utils/validation.ts

export function validateStock(stock: unknown): { valid: boolean; value?: number; error?: { code: string; message: string } } {
  const stockNumber = Number(stock);
  
  if (!Number.isInteger(stockNumber) || stockNumber < 0) {
    return {
      valid: false,
      error: {
        code: "INVALID_STOCK",
        message: "stock must be a non-negative integer"
      }
    };
  }
  
  return { valid: true, value: stockNumber };
}

export function validatePrice(price: unknown): { valid: boolean; value?: number; error?: { code: string; message: string } } {
  const priceNumber = Number(price);
  
  if (Number.isNaN(priceNumber) || priceNumber <= 0) {
    return {
      valid: false,
      error: {
        code: "INVALID_PRICE",
        message: "price must be a positive number"
      }
    };
  }
  
  return { valid: true, value: priceNumber };
}

