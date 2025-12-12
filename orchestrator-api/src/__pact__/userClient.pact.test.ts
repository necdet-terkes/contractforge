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
});
