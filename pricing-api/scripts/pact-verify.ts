import { Verifier } from '@pact-foundation/pact';
import { app } from '../src/index';
import * as http from 'http';
import { __resetDiscountRules, createDiscountRule, deleteDiscountRule, findDiscountRuleById } from '../src/discountRuleRepository';

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
      provider: 'pricing-api',
      providerBaseUrl: `http://localhost:${actualPort}`,
      pactBrokerUrl: brokerBaseUrl,
      pactBrokerUsername: brokerUsername,
      pactBrokerPassword: brokerPassword,
      providerVersion: providerVersion,
      publishVerificationResult: true,
      consumerVersionSelectors: [{ tag: providerBranch, latest: true }],
      tags: [providerBranch],
      stateHandlers: {
        'pricing rule exists for tier': async () => {
          // Ensure GOLD tier rule exists
          const existing = await findDiscountRuleById('rule-gold-default');
          if (!existing) {
            await createDiscountRule({
              id: 'rule-gold-default',
              loyaltyTier: 'GOLD',
              rate: 0.3,
              description: 'Base discount for GOLD customers',
              active: true,
            });
          }
          return Promise.resolve();
        },
        'discount rule exists': async () => {
          // Ensure rule-gold-default exists
          const existing = await findDiscountRuleById('rule-gold-default');
          if (!existing) {
            await createDiscountRule({
              id: 'rule-gold-default',
              loyaltyTier: 'GOLD',
              rate: 0.3,
              description: 'Base discount for GOLD customers',
              active: true,
            });
          }
          return Promise.resolve();
        },
        'discount rule does not exist': async () => {
          // Ensure rule-bronze-default does not exist (delete if exists)
          try {
            await deleteDiscountRule('rule-bronze-default');
          } catch (e: any) {
            // Ignore if not found
            if (e.code !== 'RULE_NOT_FOUND') throw e;
          }
          return Promise.resolve();
        },
        'discount rules exist': async () => {
          // Reset to only rule-gold-default and rule-silver-default (exactly 2 rules)
          __resetDiscountRules([]);
          await createDiscountRule({
            id: 'rule-gold-default',
            loyaltyTier: 'GOLD',
            rate: 0.3,
            description: 'Base discount for GOLD customers',
            active: true,
          });
          await createDiscountRule({
            id: 'rule-silver-default',
            loyaltyTier: 'SILVER',
            rate: 0.15,
            description: 'Base discount for SILVER customers',
            active: true,
          });
          return Promise.resolve();
        },
        'invalid pricing request': async () => {
          // No setup needed for invalid request test
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
