import { createApiError } from './httpClient';

describe('httpClient createApiError', () => {
  it('maps 404 to NOT_FOUND code', () => {
    const err = createApiError(
      { response: { status: 404, data: { message: 'missing' } } },
      'Default',
      'INVENTORY_API_ERROR'
    );
    expect(err.code).toBe('INVENTORY_API_NOT_FOUND');
    expect(err.message).toBe('missing');
  });

  it('falls back to default message and code', () => {
    const err = createApiError({}, 'Default', 'PRICING_API_ERROR');
    expect(err.code).toBe('PRICING_API_ERROR');
    expect(err.message).toBe('Default');
  });
});
