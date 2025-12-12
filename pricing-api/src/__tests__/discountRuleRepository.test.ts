import {
  __resetDiscountRules,
  createDiscountRule,
  deleteDiscountRule,
  findActiveRuleForTier,
  findDiscountRuleById,
  listDiscountRules,
  updateDiscountRule,
} from '../discountRuleRepository';
import { initialDiscountRules, LoyaltyTier } from '../discountRules';

describe('discountRuleRepository', () => {
  beforeEach(() => {
    __resetDiscountRules();
  });

  it('lists seeded rules', async () => {
    const rules = await listDiscountRules();
    expect(rules).toHaveLength(initialDiscountRules.length);
  });

  it('creates rule and retrieves by id', async () => {
    const created = await createDiscountRule({
      id: 'rule-new',
      loyaltyTier: 'GOLD',
      rate: 0.2,
      description: 'New rule',
      active: true,
    });
    expect(created).toMatchObject({ id: 'rule-new', rate: 0.2, active: true });
    const found = await findDiscountRuleById('rule-new');
    expect(found).toEqual(created);
  });

  it('rejects duplicate id', async () => {
    await expect(
      createDiscountRule({ id: initialDiscountRules[0].id, loyaltyTier: 'BRONZE', rate: 0.1 })
    ).rejects.toMatchObject({ code: 'RULE_ALREADY_EXISTS' });
  });

  it('validates rate bounds', async () => {
    await expect(
      createDiscountRule({ id: 'bad-rate', loyaltyTier: 'SILVER', rate: 2 })
    ).rejects.toMatchObject({ code: 'INVALID_RATE' });
    await expect(
      updateDiscountRule(initialDiscountRules[0].id, { rate: -0.1 })
    ).rejects.toMatchObject({ code: 'INVALID_RATE' });
  });

  it('updates rule fields', async () => {
    const target = initialDiscountRules[0].id;
    const updated = await updateDiscountRule(target, { description: 'Updated', active: false });
    expect(updated.description).toBe('Updated');
    expect(updated.active).toBe(false);
  });

  it('deletes rule', async () => {
    const target = initialDiscountRules[0].id;
    await deleteDiscountRule(target);
    const rules = await listDiscountRules();
    expect(rules.find((r) => r.id === target)).toBeUndefined();
  });

  it('throws predictable errors on missing id', async () => {
    await expect(updateDiscountRule('missing', { description: 'x' })).rejects.toMatchObject({
      code: 'RULE_NOT_FOUND',
    });
    await expect(deleteDiscountRule('missing')).rejects.toMatchObject({ code: 'RULE_NOT_FOUND' });
    const found = await findDiscountRuleById('missing');
    expect(found).toBeUndefined();
  });

  it('finds first active rule for tier', async () => {
    await __resetDiscountRules([
      { id: 'r1', loyaltyTier: 'GOLD', rate: 0.1, active: false },
      { id: 'r2', loyaltyTier: 'GOLD', rate: 0.2, active: true },
      { id: 'r3', loyaltyTier: 'GOLD', rate: 0.05, active: true },
    ]);
    const rule = await findActiveRuleForTier('GOLD' as LoyaltyTier);
    expect(rule?.id).toBe('r2');
  });
});
