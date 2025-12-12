import { HttpClient } from './utils/httpClient';
import { config } from './config';

export type DiscountRule = {
  id: string;
  loyaltyTier: 'BRONZE' | 'SILVER' | 'GOLD';
  rate: number;
  description?: string;
  active: boolean;
};

const client = new HttpClient({
  baseURL: config.pricingApiUrl,
  serviceName: 'pricing-api',
});

export async function fetchAllDiscountRules(): Promise<DiscountRule[]> {
  return await client.get<DiscountRule[]>('/pricing/rules');
}
