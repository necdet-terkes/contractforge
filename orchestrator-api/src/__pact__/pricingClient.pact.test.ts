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

  describe('GET /pricing/rules', () => {
    it('returns a list of discount rules', async () => {
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
        state: 'discount rules exist',
        uponReceiving: 'a request for all discount rules',
        withRequest: {
          method: 'GET',
          path: '/pricing/rules',
          headers: {
            Accept: 'application/json',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: [
            {
              id: like('rule-gold-default'),
              loyaltyTier: like('GOLD'),
              rate: like(0.3),
              description: like('Base discount for GOLD customers'),
              active: like(true),
            },
            {
              id: like('rule-silver-default'),
              loyaltyTier: like('SILVER'),
              rate: like(0.15),
              description: like('Base discount for SILVER customers'),
              active: like(true),
            },
          ],
        },
      });

      const client = new HttpClient({
        baseURL: provider.mockService.baseUrl,
        serviceName: 'pricing-api',
      });

      const rules = await client.get<
        Array<{
          id: string;
          loyaltyTier: string;
          rate: number;
          description?: string;
          active: boolean;
        }>
      >('/pricing/rules');

      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0]).toHaveProperty('id');
      expect(rules[0]).toHaveProperty('loyaltyTier');
      expect(rules[0]).toHaveProperty('rate');
      expect(rules[0]).toHaveProperty('active');
      expect(['BRONZE', 'SILVER', 'GOLD']).toContain(rules[0].loyaltyTier);

      await provider.verify();
      await provider.finalize();
    });
  });
});
