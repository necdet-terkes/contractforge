import { Pact } from '@pact-foundation/pact';
import { Matchers } from '@pact-foundation/pact';
import { HttpClient } from '../utils/httpClient';

const { like } = Matchers;

describe('Pact with Pricing API', () => {
  describe('GET /pricing/quote', () => {
    it('returns a pricing quote', async () => {
      const provider = new Pact({
        consumer: 'orchestrator-api',
        provider: 'pricing-api',
        port: 0,
        log: process.env.PACT_LOG_LEVEL || 'info',
        dir: './pacts',
        logLevel: 'info',
      });

      await provider.setup();

      await provider.addInteraction({
        state: 'pricing rule exists for tier',
        uponReceiving: 'a request for a pricing quote',
        withRequest: {
          method: 'GET',
          path: '/pricing/quote',
          query: {
            productId: 'p1',
            userId: 'u1',
            basePrice: '100',
            loyaltyTier: 'GOLD',
          },
          headers: {
            Accept: 'application/json',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            productId: like('p1'),
            userId: like('u1'),
            basePrice: like(100),
            discount: like(30),
            finalPrice: like(70),
            currency: like('GBP'),
          },
        },
      });

      const client = new HttpClient({
        baseURL: provider.mockService.baseUrl,
        serviceName: 'pricing-api',
      });

      const quote = await client.get<{
        productId: string;
        userId: string;
        basePrice: number;
        discount: number;
        finalPrice: number;
        currency: string;
      }>('/pricing/quote', {
        params: {
          productId: 'p1',
          userId: 'u1',
          basePrice: '100',
          loyaltyTier: 'GOLD',
        },
      });

      expect(quote.productId).toBe('p1');
      expect(quote.userId).toBe('u1');
      expect(typeof quote.basePrice).toBe('number');
      expect(typeof quote.discount).toBe('number');
      expect(typeof quote.finalPrice).toBe('number');
      expect(quote.currency).toBe('GBP');
      expect(quote.finalPrice).toBe(quote.basePrice - quote.discount);

      await provider.verify();
      await provider.finalize();
    });

    it('returns 400 for invalid basePrice', async () => {
      const provider = new Pact({
        consumer: 'orchestrator-api',
        provider: 'pricing-api',
        port: 0,
        log: process.env.PACT_LOG_LEVEL || 'info',
        dir: './pacts',
        logLevel: 'info',
      });

      await provider.setup();

      await provider.addInteraction({
        state: 'invalid pricing request',
        uponReceiving: 'a request with invalid basePrice',
        withRequest: {
          method: 'GET',
          path: '/pricing/quote',
          query: {
            productId: 'p1',
            userId: 'u1',
            basePrice: '0',
            loyaltyTier: 'GOLD',
          },
          headers: {
            Accept: 'application/json',
          },
        },
        willRespondWith: {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: like('INVALID_REQUEST'),
            message: like('basePrice must be positive'),
          },
        },
      });

      const client = new HttpClient({
        baseURL: provider.mockService.baseUrl,
        serviceName: 'pricing-api',
      });

      await expect(
        client.get('/pricing/quote', {
          params: {
            productId: 'p1',
            userId: 'u1',
            basePrice: '0',
            loyaltyTier: 'GOLD',
          },
        })
      ).rejects.toThrow();

      await provider.verify();
      await provider.finalize();
    });
  });
});
