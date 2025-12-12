import pact from '@pact-foundation/pact-node';
import * as path from 'path';

const brokerBaseUrl = process.env.PACT_BROKER_BASE_URL || 'http://localhost:9292';
const brokerUsername = process.env.PACT_BROKER_USERNAME || 'pact';
const brokerPassword = process.env.PACT_BROKER_PASSWORD || 'pact';

// Generate unique version for local development to avoid broker conflicts
// In CI, use GIT_COMMIT or PACT_CONSUMER_VERSION
const getConsumerVersion = (): string => {
  if (process.env.PACT_CONSUMER_VERSION) {
    return process.env.PACT_CONSUMER_VERSION;
  }
  if (process.env.GIT_COMMIT) {
    return process.env.GIT_COMMIT;
  }
  // Local development: use timestamp to ensure unique versions
  return `local-dev-${Date.now()}`;
};

const consumerVersion = getConsumerVersion();
const consumerBranch = process.env.PACT_CONSUMER_BRANCH || process.env.GIT_BRANCH || 'local';

const opts = {
  pactFilesOrDirs: [path.resolve(__dirname, '../pacts')],
  pactBroker: brokerBaseUrl,
  pactBrokerUsername: brokerUsername,
  pactBrokerPassword: brokerPassword,
  consumerVersion,
  tags: [consumerBranch],
};

pact
  .publishPacts(opts)
  .then(() => {
    console.log(`Pacts published to ${brokerBaseUrl}`);
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('Error publishing pacts:', error);
    process.exit(1);
  });
