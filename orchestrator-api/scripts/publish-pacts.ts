import pact from '@pact-foundation/pact-node';
import * as path from 'path';

const brokerBaseUrl = process.env.PACT_BROKER_BASE_URL || 'http://localhost:9292';
const brokerUsername = process.env.PACT_BROKER_USERNAME || 'pact';
const brokerPassword = process.env.PACT_BROKER_PASSWORD || 'pact';
const consumerVersion = process.env.PACT_CONSUMER_VERSION || process.env.GIT_COMMIT || 'local-dev';
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
