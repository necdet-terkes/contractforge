import { __resetDiscountRules, createDiscountRule } from '../discountRuleRepository';
import { calculatePricing } from '../pricing';

describe('calculatePricing', () => {
  beforeEach(async () => {
    __resetDiscountRules([]);
    await createDiscountRule({
      id: 'tier-gold',
      loyaltyTier: 'GOLD',
      rate: 0.25,
      description: 'gold rule',
      active: true,
    });
  });

  it('applies active rule and rounds discount', async () => {
    const quote = await calculatePricing('p1', 'u1', 99, 'GOLD');
    expect(quote.discount).toBe(Math.round(99 * 0.25));
    expect(quote.finalPrice).toBe(99 - quote.discount);
    expect(quote.currency).toBe('GBP');
  });

  it('uses first active rule for tier', async () => {
    await createDiscountRule({
      id: 'tier-gold-second',
      loyaltyTier: 'GOLD',
      rate: 0.1,
      description: 'lower rate',
      active: true,
    });
    const quote = await calculatePricing('p1', 'u1', 100, 'GOLD');
    expect(quote.discount).toBe(Math.round(100 * 0.25));
  });

  it('falls back to zero discount when no rule', async () => {
    __resetDiscountRules([]);
    const quote = await calculatePricing('p1', 'u1', 50, 'SILVER');
    expect(quote.discount).toBe(0);
    expect(quote.finalPrice).toBe(50);
  });
});
