import { Pact } from '@pact-foundation/pact';
import { Matchers } from '@pact-foundation/pact';
import { HttpClient } from '../utils/httpClient';

const { like, regex } = Matchers;

describe('Pact with User API', () => {
  describe('GET /users/:id', () => {
    it('returns a user by id', async () => {
      const provider = new Pact({
        consumer: 'orchestrator-api',
        provider: 'user-api',
        port: 0,
        log: process.env.PACT_LOG_LEVEL || 'info',
        dir: './pacts',
        logLevel: 'info',
      });

      await provider.setup();

      const userId = 'u1';

      await provider.addInteraction({
        state: 'user exists',
        uponReceiving: 'a request for a user by id',
        withRequest: {
          method: 'GET',
          path: `/users/${userId}`,
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
            id: like('u1'),
            name: like('Alice Example'),
            loyaltyTier: like('GOLD'),
          },
        },
      });

      const client = new HttpClient({
        baseURL: provider.mockService.baseUrl,
        serviceName: 'user-api',
      });

      const user = await client.get<{ id: string; name: string; loyaltyTier: string }>(
        `/users/${userId}`
      );

      expect(user.id).toBe(userId);
      expect(user.name).toBeTruthy();
      expect(['BRONZE', 'SILVER', 'GOLD']).toContain(user.loyaltyTier);

      await provider.verify();
      await provider.finalize();
    });

    it('returns 404 when user not found', async () => {
      const provider = new Pact({
        consumer: 'orchestrator-api',
        provider: 'user-api',
        port: 0,
        log: process.env.PACT_LOG_LEVEL || 'info',
        dir: './pacts',
        logLevel: 'info',
      });

      await provider.setup();

      const userId = 'u999';

      await provider.addInteraction({
        state: 'user does not exist',
        uponReceiving: 'a request for a non-existent user',
        withRequest: {
          method: 'GET',
          path: `/users/${userId}`,
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
            error: like('USER_NOT_FOUND'),
            message: like('User not found'),
          },
        },
      });

      const client = new HttpClient({
        baseURL: provider.mockService.baseUrl,
        serviceName: 'user-api',
      });

      await expect(client.get(`/users/${userId}`)).rejects.toThrow();

      await provider.verify();
      await provider.finalize();
    });
  });

  describe('GET /users', () => {
    it('returns a list of users', async () => {
      const provider = new Pact({
        consumer: 'orchestrator-api',
        provider: 'user-api',
        port: 0,
        log: process.env.PACT_LOG_LEVEL || 'info',
        dir: './pacts',
        logLevel: 'info',
      });

      await provider.setup();

      await provider.addInteraction({
        state: 'users exist',
        uponReceiving: 'a request for all users',
        withRequest: {
          method: 'GET',
          path: '/users',
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
              id: like('u1'),
              name: like('Alice Example'),
              loyaltyTier: like('GOLD'),
            },
            {
              id: like('u2'),
              name: like('Bob Example'),
              loyaltyTier: like('SILVER'),
            },
          ],
        },
      });

      const client = new HttpClient({
        baseURL: provider.mockService.baseUrl,
        serviceName: 'user-api',
      });

      const users = await client.get<
        Array<{
          id: string;
          name: string;
          loyaltyTier: string;
        }>
      >('/users');

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      expect(users[0]).toHaveProperty('id');
      expect(users[0]).toHaveProperty('name');
      expect(users[0]).toHaveProperty('loyaltyTier');
      expect(['BRONZE', 'SILVER', 'GOLD']).toContain(users[0].loyaltyTier);

      await provider.verify();
      await provider.finalize();
    });
  });

  describe('POST /users', () => {
    it('creates a new user', async () => {
      const provider = new Pact({
        consumer: 'orchestrator-api',
        provider: 'user-api',
        port: 0,
        log: process.env.PACT_LOG_LEVEL || 'info',
        dir: './pacts',
        logLevel: 'info',
      });

      await provider.setup();

      await provider.addInteraction({
        state: 'user does not exist',
        uponReceiving: 'a request to create a user',
        withRequest: {
          method: 'POST',
          path: '/users',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: {
            id: like('u3'),
            name: like('Charlie Example'),
            loyaltyTier: like('BRONZE'),
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            id: like('u3'),
            name: like('Charlie Example'),
            loyaltyTier: like('BRONZE'),
          },
        },
      });

      const client = new HttpClient({
        baseURL: provider.mockService.baseUrl,
        serviceName: 'user-api',
      });

      const user = await client.post<{ id: string; name: string; loyaltyTier: string }>('/users', {
        id: 'u3',
        name: 'Charlie Example',
        loyaltyTier: 'BRONZE',
      });

      expect(user.id).toBeTruthy();
      expect(user.name).toBeTruthy();
      expect(['BRONZE', 'SILVER', 'GOLD']).toContain(user.loyaltyTier);

      await provider.verify();
      await provider.finalize();
    });
  });

  describe('PUT /users/:id', () => {
    it('updates an existing user', async () => {
      const provider = new Pact({
        consumer: 'orchestrator-api',
        provider: 'user-api',
        port: 0,
        log: process.env.PACT_LOG_LEVEL || 'info',
        dir: './pacts',
        logLevel: 'info',
      });

      await provider.setup();

      const userId = 'u1';

      await provider.addInteraction({
        state: 'user exists',
        uponReceiving: 'a request to update a user',
        withRequest: {
          method: 'PUT',
          path: `/users/${userId}`,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: {
            name: like('Alice Updated'),
            loyaltyTier: like('SILVER'),
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            id: like(userId),
            name: like('Alice Updated'),
            loyaltyTier: like('SILVER'),
          },
        },
      });

      const client = new HttpClient({
        baseURL: provider.mockService.baseUrl,
        serviceName: 'user-api',
      });

      const user = await client.put<{ id: string; name: string; loyaltyTier: string }>(
        `/users/${userId}`,
        {
          name: 'Alice Updated',
          loyaltyTier: 'SILVER',
        }
      );

      expect(user.id).toBe(userId);
      expect(user.name).toBeTruthy();
      expect(['BRONZE', 'SILVER', 'GOLD']).toContain(user.loyaltyTier);

      await provider.verify();
      await provider.finalize();
    });
  });

  describe('DELETE /users/:id', () => {
    it('deletes an existing user', async () => {
      const provider = new Pact({
        consumer: 'orchestrator-api',
        provider: 'user-api',
        port: 0,
        log: process.env.PACT_LOG_LEVEL || 'info',
        dir: './pacts',
        logLevel: 'info',
      });

      await provider.setup();

      const userId = 'u1';

      await provider.addInteraction({
        state: 'user exists',
        uponReceiving: 'a request to delete a user',
        withRequest: {
          method: 'DELETE',
          path: `/users/${userId}`,
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
        serviceName: 'user-api',
      });

      await client.delete(`/users/${userId}`);

      await provider.verify();
      await provider.finalize();
    });
  });
});
