import { HttpClient } from "./utils/httpClient";
import { config } from "./config";

export type PricingInfo = {
  productId: string;
  userId: string;
  basePrice: number;
  discount: number;
  finalPrice: number;
  currency: string;
};

const client = new HttpClient({
  baseURL: config.pricingApiUrl,
  serviceName: "pricing-api"
});

export async function fetchPricingQuote(params: {
  productId: string;
  userId: string;
  basePrice: number;
  loyaltyTier: string;
}): Promise<PricingInfo> {
  return await client.get<PricingInfo>("/pricing/quote", {
    params: {
      productId: params.productId,
      userId: params.userId,
      basePrice: String(params.basePrice),
      loyaltyTier: params.loyaltyTier
    }
  });
}