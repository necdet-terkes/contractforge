import axios from "axios";

export type PricingInfo = {
  productId: string;
  userId: string;
  basePrice: number;
  discount: number;
  finalPrice: number;
  currency: string;
};

const PRICING_API_URL =
  process.env.PRICING_API_URL || "http://localhost:4003";

export async function fetchPricingQuote(params: {
  productId: string;
  userId: string;
  basePrice: number;
  loyaltyTier: string;
}): Promise<PricingInfo> {
  const { productId, userId, basePrice, loyaltyTier } = params;

  const url = `${PRICING_API_URL}/pricing/quote`;
  const query = new URLSearchParams({
    productId,
    userId,
    basePrice: String(basePrice),
    loyaltyTier
  });

  try {
    const response = await axios.get<PricingInfo>(`${url}?${query.toString()}`, {
      headers: { Accept: "application/json" }
    });
    return response.data;
  } catch (error: any) {
    const e = new Error("Failed to fetch pricing from pricing-api");
    (e as any).code = "PRICING_API_ERROR";
    throw e;
  }
}