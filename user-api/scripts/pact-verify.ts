import { Verifier } from '@pact-foundation/pact';
import { app } from '../src/index';
import * as http from 'http';

const brokerBaseUrl = process.env.PACT_BROKER_BASE_URL || 'http://localhost:9292';
const brokerUsername = process.env.PACT_BROKER_USERNAME || 'pact';
const brokerPassword = process.env.PACT_BROKER_PASSWORD || 'pact';
const providerVersion = process.env.PACT_PROVIDER_VERSION || process.env.GIT_COMMIT || 'local-dev';
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
          return Promise.resolve();
        },
        'user does not exist': async () => {
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
