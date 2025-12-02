// pricing-api/src/discountRuleRepository.ts

import {
  DiscountRule,
  initialDiscountRules,
  LoyaltyTier
} from "./discountRules";

let rules: DiscountRule[] = [...initialDiscountRules];

export async function listDiscountRules(): Promise<DiscountRule[]> {
  return rules;
}

export async function findDiscountRuleById(
  id: string
): Promise<DiscountRule | undefined> {
  return rules.find((r) => r.id === id);
}

export async function findActiveRuleForTier(
  tier: LoyaltyTier
): Promise<DiscountRule | undefined> {
  // For now: first active rule for the given loyalty tier
  return rules.find((r) => r.loyaltyTier === tier && r.active);
}

export async function createDiscountRule(input: {
  id: string;
  loyaltyTier: LoyaltyTier;
  rate: number;
  description?: string;
  active?: boolean;
}): Promise<DiscountRule> {
  const exists = rules.some((r) => r.id === input.id);
  if (exists) {
    const error = new Error(
      `Discount rule with id '${input.id}' already exists`
    );
    (error as any).code = "RULE_ALREADY_EXISTS";
    throw error;
  }

  if (input.rate < 0 || input.rate > 1) {
    const error = new Error("rate must be between 0 and 1");
    (error as any).code = "INVALID_RATE";
    throw error;
  }

  const newRule: DiscountRule = {
    id: input.id,
    loyaltyTier: input.loyaltyTier,
    rate: input.rate,
    description: input.description,
    active: input.active ?? true
  };

  rules.push(newRule);
  return newRule;
}

export async function updateDiscountRule(
  id: string,
  updates: Partial<Pick<DiscountRule, "loyaltyTier" | "rate" | "description" | "active">>
): Promise<DiscountRule> {
  const idx = rules.findIndex((r) => r.id === id);
  if (idx === -1) {
    const error = new Error(`Discount rule with id '${id}' not found`);
    (error as any).code = "RULE_NOT_FOUND";
    throw error;
  }

  if (updates.rate != null) {
    if (updates.rate < 0 || updates.rate > 1) {
      const error = new Error("rate must be between 0 and 1");
      (error as any).code = "INVALID_RATE";
      throw error;
    }
  }

  const current = rules[idx];
  const updated: DiscountRule = {
    ...current,
    ...updates
  };

  rules[idx] = updated;
  return updated;
}

export async function deleteDiscountRule(id: string): Promise<void> {
  const idx = rules.findIndex((r) => r.id === id);
  if (idx === -1) {
    const error = new Error(`Discount rule with id '${id}' not found`);
    (error as any).code = "RULE_NOT_FOUND";
    throw error;
  }

  rules.splice(idx, 1);
}