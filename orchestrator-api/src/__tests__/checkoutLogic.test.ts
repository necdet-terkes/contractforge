import { buildCheckoutPreview, mapCheckoutError } from '../checkoutLogic';

describe('checkoutLogic', () => {
  it('builds preview shape', () => {
    const preview = buildCheckoutPreview({
      product: { id: 'p1', name: 'Prod', stock: 2, price: 100 },
      user: { id: 'u1', name: 'User', loyaltyTier: 'GOLD' },
      pricing: {
        productId: 'p1',
        userId: 'u1',
        basePrice: 100,
        discount: 20,
        finalPrice: 80,
        currency: 'GBP',
      },
    });
    expect(preview.product.basePrice).toBe(100);
    expect(preview.user.loyaltyTier).toBe('GOLD');
    expect(preview.pricing.finalPrice).toBe(80);
  });

  it('maps known errors with status codes', () => {
    expect(mapCheckoutError({ code: 'PRODUCT_NOT_FOUND', message: 'x' })).toEqual({
      code: 'PRODUCT_NOT_FOUND',
      status: 404,
      message: 'x',
    });
    expect(mapCheckoutError({ code: 'USER_NOT_FOUND', message: 'y' }).status).toBe(404);
    expect(mapCheckoutError({ code: 'PRICING_API_ERROR', message: 'z' }).status).toBe(502);
  });

  it('defaults to upstream unavailable', () => {
    const mapped = mapCheckoutError(new Error('boom'));
    expect(mapped.code).toBe('UPSTREAM_UNAVAILABLE');
    expect(mapped.status).toBe(502);
  });
});
