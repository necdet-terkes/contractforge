import { Verifier } from '@pact-foundation/pact';
import { app } from '../src/index';
import * as http from 'http';
import { __resetUsers, createUser, deleteUser, findUserById } from '../src/userRepository';

const brokerBaseUrl = process.env.PACT_BROKER_BASE_URL || 'http://localhost:9292';
const brokerUsername = process.env.PACT_BROKER_USERNAME || 'pact';
const brokerPassword = process.env.PACT_BROKER_PASSWORD || 'pact';

// Generate unique version for local development to avoid broker conflicts
const getProviderVersion = (): string => {
  if (process.env.PACT_PROVIDER_VERSION) {
    return process.env.PACT_PROVIDER_VERSION;
  }
  if (process.env.GIT_COMMIT) {
    return process.env.GIT_COMMIT;
  }
  // Local development: use timestamp to ensure unique versions
  return `local-dev-${Date.now()}`;
};

const providerVersion = getProviderVersion();
const providerBranch = process.env.PACT_PROVIDER_BRANCH || process.env.GIT_BRANCH || 'local';

let server: http.Server | null = null;
let actualPort: number;
const requestedPort = process.env.PACT_PROVIDER_PORT
  ? parseInt(process.env.PACT_PROVIDER_PORT, 10)
  : 0; // 0 = random free port

const startServer = (): Promise<void> => {
  return new Promise((resolve) => {
    server = app.listen(requestedPort, () => {
      const address = server?.address();
      actualPort = typeof address === 'object' && address ? address.port : requestedPort;
      console.log(`Provider server started on port ${actualPort}`);
      resolve();
    });
  });
};

const stopServer = (): Promise<void> => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('Provider server stopped');
        resolve();
      });
    } else {
      resolve();
    }
  });
};

startServer()
  .then(() => {
    const opts = {
      provider: 'user-api',
      providerBaseUrl: `http://localhost:${actualPort}`,
      pactBrokerUrl: brokerBaseUrl,
      pactBrokerUsername: brokerUsername,
      pactBrokerPassword: brokerPassword,
      providerVersion: providerVersion,
      publishVerificationResult: true,
      consumerVersionSelectors: [{ tag: providerBranch, latest: true }],
      tags: [providerBranch],
      stateHandlers: {
        'user exists': async () => {
          // Ensure u1 exists
          const existing = await findUserById('u1');
          if (!existing) {
            await createUser({ id: 'u1', name: 'Alice Example', loyaltyTier: 'GOLD' });
          }
          return Promise.resolve();
        },
        'user does not exist': async () => {
          // Ensure u3 does not exist (for POST /users test - contract expects u3)
          try {
            await deleteUser('u3');
          } catch (e: any) {
            if (e.code !== 'USER_NOT_FOUND') throw e;
          }
          // Also ensure u999 does not exist (for GET /users/u999 test)
          try {
            await deleteUser('u999');
          } catch (e: any) {
            // Ignore if not found
            if (e.code !== 'USER_NOT_FOUND') throw e;
          }
          return Promise.resolve();
        },
        'users exist': async () => {
          // Reset to only u1 and u2 (exactly 2 users as expected by contract)
          __resetUsers([]);
          await createUser({ id: 'u1', name: 'Alice Example', loyaltyTier: 'GOLD' });
          await createUser({ id: 'u2', name: 'Bob Example', loyaltyTier: 'SILVER' });
          return Promise.resolve();
        },
      },
    };

    return new Verifier(opts).verifyProvider();
  })
  .then(() => {
    console.log('Pact verification successful');
    return stopServer();
  })
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Pact verification failed:', error);
    stopServer().then(() => {
      process.exit(1);
    });
  });
