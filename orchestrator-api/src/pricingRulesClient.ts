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

export async function fetchDiscountRuleById(ruleId: string): Promise<DiscountRule> {
  return await client.get<DiscountRule>(`/pricing/rules/${ruleId}`);
}

export async function createDiscountRule(rule: {
  id: string;
  loyaltyTier: 'BRONZE' | 'SILVER' | 'GOLD';
  rate: number;
  description?: string;
  active: boolean;
}): Promise<DiscountRule> {
  return await client.post<DiscountRule>('/pricing/rules', rule);
}

export async function updateDiscountRule(ruleId: string, updates: {
  loyaltyTier?: 'BRONZE' | 'SILVER' | 'GOLD';
  rate?: number;
  description?: string;
  active?: boolean;
}): Promise<DiscountRule> {
  return await client.put<DiscountRule>(`/pricing/rules/${ruleId}`, updates);
}

export async function deleteDiscountRule(ruleId: string): Promise<void> {
  return await client.delete(`/pricing/rules/${ruleId}`);
}
