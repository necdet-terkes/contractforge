import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const brokerBaseUrl = process.env.PACT_BROKER_BASE_URL || 'http://localhost:9292';
const brokerUsername = process.env.PACT_BROKER_USERNAME || 'pact';
const brokerPassword = process.env.PACT_BROKER_PASSWORD || 'pact';
const pactsDir = path.resolve(process.cwd(), 'tools/mockoon/pacts');

// Provider names and their corresponding consumers
const providers = ['inventory-api', 'user-api', 'pricing-api'];
const consumer = 'orchestrator-api';

interface PactBrokerPact {
  _links: {
    'pb:pact-version': {
      href: string;
    };
  };
}

interface PactBrokerPactsResponse {
  _links: {
    pacts: Array<{
      href: string;
    }>;
  };
  _embedded: {
    pacts: PactBrokerPact[];
  };
}

async function downloadPactFromBroker(provider: string): Promise<void> {
  const auth = Buffer.from(`${brokerUsername}:${brokerPassword}`).toString('base64');
  const url = `${brokerBaseUrl}/pacts/provider/${provider}/consumer/${consumer}/latest`;

  try {
    console.log(`Downloading pact from broker: ${provider}...`);
    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
    });

    const outputPath = path.join(pactsDir, `${consumer}-${provider}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(response.data, null, 2));
    console.log(`✓ Downloaded: ${outputPath}`);
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.warn(`⚠ Pact not found in broker for ${provider}, skipping...`);
    } else {
      throw error;
    }
  }
}

async function copyLocalPacts(): Promise<void> {
  const localPactsDir = path.resolve(process.cwd(), 'orchestrator-api/pacts');
  console.log(`Using local pacts from: ${localPactsDir}`);

  if (!fs.existsSync(localPactsDir)) {
    throw new Error(`Local pacts directory not found: ${localPactsDir}`);
  }

  for (const provider of providers) {
    const localPactFile = path.join(localPactsDir, `${consumer}-${provider}.json`);
    const targetPactFile = path.join(pactsDir, `${consumer}-${provider}.json`);

    if (fs.existsSync(localPactFile)) {
      fs.copyFileSync(localPactFile, targetPactFile);
      console.log(`✓ Copied: ${localPactFile} → ${targetPactFile}`);
    } else {
      console.warn(`⚠ Local pact not found: ${localPactFile}`);
    }
  }
}

async function main(): Promise<void> {
  // Ensure pacts directory exists
  if (!fs.existsSync(pactsDir)) {
    fs.mkdirSync(pactsDir, { recursive: true });
  }

  const useBroker = process.env.PACT_SOURCE === 'broker' || process.env.PACT_BROKER_BASE_URL;

  if (useBroker) {
    console.log('Pulling pacts from Pact Broker...');
    try {
      // Test broker connectivity
      await axios.get(`${brokerBaseUrl}/health`, {
        auth: {
          username: brokerUsername,
          password: brokerPassword,
        },
      });

      // Download pacts for each provider
      for (const provider of providers) {
        await downloadPactFromBroker(provider);
      }
      console.log('✓ All pacts downloaded from broker');
    } catch (error: any) {
      console.warn('⚠ Failed to pull from broker, falling back to local pacts...');
      console.warn(`  Error: ${error.message}`);
      await copyLocalPacts();
    }
  } else {
    console.log('Using local pact files...');
    await copyLocalPacts();
  }
}

main().catch((error) => {
  console.error('Error pulling pacts:', error);
  process.exit(1);
});
