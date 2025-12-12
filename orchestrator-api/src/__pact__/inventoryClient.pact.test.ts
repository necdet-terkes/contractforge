import { Pact } from '@pact-foundation/pact';
import { Matchers } from '@pact-foundation/pact';
import { HttpClient } from '../utils/httpClient';

const { like } = Matchers;

describe('Pact with Inventory API', () => {
  describe('GET /products/:id', () => {
    it('returns a product by id', async () => {
      const provider = new Pact({
        consumer: 'orchestrator-api',
        provider: 'inventory-api',
        port: 0,
        log: process.env.PACT_LOG_LEVEL || 'info',
        dir: './pacts',
        logLevel: 'info',
      });

      await provider.setup();

      const productId = 'p1';

      await provider.addInteraction({
        state: 'product exists',
        uponReceiving: 'a request for a product by id',
        withRequest: {
          method: 'GET',
          path: `/products/${productId}`,
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
            id: like('p1'),
            name: like('Coffee Machine'),
            stock: like(3),
            price: like(100),
          },
        },
      });

      const client = new HttpClient({
        baseURL: provider.mockService.baseUrl,
        serviceName: 'inventory-api',
      });

      const product = await client.get<{
        id: string;
        name: string;
        stock: number;
        price: number;
      }>(`/products/${productId}`);

      expect(product.id).toBe(productId);
      expect(product.name).toBeTruthy();
      expect(typeof product.stock).toBe('number');
      expect(typeof product.price).toBe('number');

      await provider.verify();
      await provider.finalize();
    });

    it('returns 404 when product not found', async () => {
      const provider = new Pact({
        consumer: 'orchestrator-api',
        provider: 'inventory-api',
        port: 0,
        log: process.env.PACT_LOG_LEVEL || 'info',
        dir: './pacts',
        logLevel: 'info',
      });

      await provider.setup();

      const productId = 'p999';

      await provider.addInteraction({
        state: 'product does not exist',
        uponReceiving: 'a request for a non-existent product',
        withRequest: {
          method: 'GET',
          path: `/products/${productId}`,
          headers: {
            Accept: 'application/json',
          },
        },
        willRespondWith: {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: like('PRODUCT_NOT_FOUND'),
            message: like('Product not found'),
          },
        },
      });

      const client = new HttpClient({
        baseURL: provider.mockService.baseUrl,
        serviceName: 'inventory-api',
      });

      await expect(client.get(`/products/${productId}`)).rejects.toThrow();

      await provider.verify();
      await provider.finalize();
    });
  });
});
