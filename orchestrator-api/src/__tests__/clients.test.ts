import { buildProductPath } from '../inventoryClient';
import { buildUserPath } from '../userClient';
import { buildPricingQuery } from '../pricingClient';
import { createApiError } from '../utils/httpClient';

describe('client helpers', () => {
  it('builds inventory product path', () => {
    expect(buildProductPath('p1')).toBe('/products/p1');
  });

  it('builds user path', () => {
    expect(buildUserPath('u1')).toBe('/users/u1');
  });

  it('builds pricing query string params', () => {
    const params = buildPricingQuery({
      productId: 'p1',
      userId: 'u1',
      basePrice: 10,
      loyaltyTier: 'GOLD',
    });
    expect(params).toEqual({
      productId: 'p1',
      userId: 'u1',
      basePrice: '10',
      loyaltyTier: 'GOLD',
    });
  });

  it('maps 404 errors to _NOT_FOUND code', () => {
    const err = createApiError(
      { response: { status: 404, data: { message: 'missing' } } },
      'Default',
      'INVENTORY_API_ERROR'
    );
    expect(err.code).toBe('INVENTORY_NOT_FOUND');
  });
});
