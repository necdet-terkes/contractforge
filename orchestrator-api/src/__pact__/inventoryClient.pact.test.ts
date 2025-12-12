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

  describe('GET /products', () => {
    it('returns a list of products', async () => {
      const provider = new Pact({
        consumer: 'orchestrator-api',
        provider: 'inventory-api',
        port: 0,
        log: process.env.PACT_LOG_LEVEL || 'info',
        dir: './pacts',
        logLevel: 'info',
      });

      await provider.setup();

      await provider.addInteraction({
        state: 'products exist',
        uponReceiving: 'a request for all products',
        withRequest: {
          method: 'GET',
          path: '/products',
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
              id: like('p1'),
              name: like('Coffee Machine'),
              stock: like(3),
              price: like(100),
            },
            {
              id: like('p2'),
              name: like('Laptop'),
              stock: like(5),
              price: like(800),
            },
          ],
        },
      });

      const client = new HttpClient({
        baseURL: provider.mockService.baseUrl,
        serviceName: 'inventory-api',
      });

      const products = await client.get<
        Array<{
          id: string;
          name: string;
          stock: number;
          price: number;
        }>
      >('/products');

      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);
      expect(products[0]).toHaveProperty('id');
      expect(products[0]).toHaveProperty('name');
      expect(products[0]).toHaveProperty('stock');
      expect(products[0]).toHaveProperty('price');

      await provider.verify();
      await provider.finalize();
    });
  });

  describe('POST /products', () => {
    it('creates a new product', async () => {
      const provider = new Pact({
        consumer: 'orchestrator-api',
        provider: 'inventory-api',
        port: 0,
        log: process.env.PACT_LOG_LEVEL || 'info',
        dir: './pacts',
        logLevel: 'info',
      });

      await provider.setup();

      await provider.addInteraction({
        state: 'product does not exist',
        uponReceiving: 'a request to create a product',
        withRequest: {
          method: 'POST',
          path: '/products',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: {
            id: like('p3'),
            name: like('Tablet'),
            stock: like(10),
            price: like(300),
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            id: like('p3'),
            name: like('Tablet'),
            stock: like(10),
            price: like(300),
          },
        },
      });

      const client = new HttpClient({
        baseURL: provider.mockService.baseUrl,
        serviceName: 'inventory-api',
      });

      const product = await client.post<{ id: string; name: string; stock: number; price: number }>(
        '/products',
        {
          id: 'p3',
          name: 'Tablet',
          stock: 10,
          price: 300,
        }
      );

      expect(product.id).toBeTruthy();
      expect(product.name).toBeTruthy();
      expect(typeof product.stock).toBe('number');
      expect(typeof product.price).toBe('number');

      await provider.verify();
      await provider.finalize();
    });
  });

  describe('PUT /products/:id', () => {
    it('updates an existing product', async () => {
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
        uponReceiving: 'a request to update a product',
        withRequest: {
          method: 'PUT',
          path: `/products/${productId}`,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: {
            name: like('Coffee Machine Pro'),
            stock: like(5),
            price: like(120),
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            id: like(productId),
            name: like('Coffee Machine Pro'),
            stock: like(5),
            price: like(120),
          },
        },
      });

      const client = new HttpClient({
        baseURL: provider.mockService.baseUrl,
        serviceName: 'inventory-api',
      });

      const product = await client.put<{ id: string; name: string; stock: number; price: number }>(
        `/products/${productId}`,
        {
          name: 'Coffee Machine Pro',
          stock: 5,
          price: 120,
        }
      );

      expect(product.id).toBe(productId);
      expect(product.name).toBeTruthy();
      expect(typeof product.stock).toBe('number');
      expect(typeof product.price).toBe('number');

      await provider.verify();
      await provider.finalize();
    });
  });

  describe('DELETE /products/:id', () => {
    it('deletes an existing product', async () => {
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
        uponReceiving: 'a request to delete a product',
        withRequest: {
          method: 'DELETE',
          path: `/products/${productId}`,
          headers: {
            Accept: 'application/json',
          },
        },
        willRespondWith: {
          status: 204,
        },
      });

      const client = new HttpClient({
        baseURL: provider.mockService.baseUrl,
        serviceName: 'inventory-api',
      });

      await client.delete(`/products/${productId}`);

      await provider.verify();
      await provider.finalize();
    });
  });
});
