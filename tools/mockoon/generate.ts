import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

function uuidv4(): string {
  return crypto.randomUUID();
}

interface PactInteraction {
  description: string;
  providerState?: string;
  request: {
    method: string;
    path: string;
    query?: string;
    headers?: Record<string, string>;
  };
  response: {
    status: number;
    headers?: Record<string, string>;
    body?: any;
  };
}

interface PactContract {
  consumer: { name: string };
  provider: { name: string };
  interactions: PactInteraction[];
}

interface MockoonRoute {
  uuid: string;
  method: string;
  endpoint: string;
  responses: Array<{
    uuid: string;
    statusCode: number;
    headers?: Record<string, string>;
    body?: string;
    label?: string;
  }>;
}

interface MockoonEnvironment {
  uuid: string;
  lastMigration: number;
  name: string;
  port: number;
  hostname: string;
  routes: MockoonRoute[];
  cors: boolean;
}

// Provider to port mapping
const PROVIDER_PORTS: Record<string, number> = {
  'inventory-api': 5001,
  'user-api': 5002,
  'pricing-api': 5003,
};

const pactsDir = path.resolve(process.cwd(), 'tools/mockoon/pacts');
const generatedDir = path.resolve(process.cwd(), 'tools/mockoon/generated');

function extractPathParams(pathStr: string): { path: string; params: string[] } {
  // Convert /products/:id to /products/{id} for Mockoon
  const params: string[] = [];
  const mockoonPath = pathStr.replace(/:(\w+)/g, (_, param) => {
    params.push(param);
    return `{${param}}`;
  });
  return { path: mockoonPath, params };
}

function convertInteractionToRoute(interaction: PactInteraction): MockoonRoute {
  const { path: mockoonPath } = extractPathParams(interaction.request.path);

  // Build endpoint with query params if needed
  let endpoint = mockoonPath;
  if (interaction.request.query) {
    // For Mockoon, we'll handle query params in the route matching
    // For now, we'll add them as part of the endpoint
    endpoint = `${mockoonPath}?${interaction.request.query}`;
  }

  const response: MockoonRoute['responses'][0] = {
    uuid: uuidv4(),
    statusCode: interaction.response.status,
    label: interaction.description,
  };

  // Add headers if present
  if (interaction.response.headers) {
    response.headers = interaction.response.headers;
  }

  // Add body if present
  if (interaction.response.body) {
    response.body = JSON.stringify(interaction.response.body, null, 2);
  }

  return {
    uuid: uuidv4(),
    method: interaction.request.method,
    endpoint,
    responses: [response],
  };
}

function generateEnvironmentForProvider(provider: string, pact: PactContract): MockoonEnvironment {
  const routes: MockoonRoute[] = [];

  // Group interactions by method + path to combine multiple responses
  const routeMap = new Map<string, MockoonRoute>();

  for (const interaction of pact.interactions) {
    const { path: mockoonPath } = extractPathParams(interaction.request.path);
    const routeKey = `${interaction.request.method}:${mockoonPath}`;

    if (routeMap.has(routeKey)) {
      // Add response to existing route
      const existingRoute = routeMap.get(routeKey)!;
      const { path: mockoonPath } = extractPathParams(interaction.request.path);
      let endpoint = mockoonPath;
      if (interaction.request.query) {
        endpoint = `${mockoonPath}?${interaction.request.query}`;
      }

      const response: MockoonRoute['responses'][0] = {
        uuid: uuidv4(),
        statusCode: interaction.response.status,
        label: interaction.description,
      };

      if (interaction.response.headers) {
        response.headers = interaction.response.headers;
      }

      if (interaction.response.body) {
        response.body = JSON.stringify(interaction.response.body, null, 2);
      }

      existingRoute.responses.push(response);
    } else {
      // Create new route
      const route = convertInteractionToRoute(interaction);
      routeMap.set(routeKey, route);
    }
  }

  routes.push(...Array.from(routeMap.values()));

  return {
    uuid: uuidv4(),
    lastMigration: 29,
    name: `${provider} (Mock)`,
    port: PROVIDER_PORTS[provider] || 5000,
    hostname: '0.0.0.0',
    routes,
    cors: true,
  };
}

async function main(): Promise<void> {
  console.log('Generating Mockoon environments from Pact contracts...\n');

  // Ensure generated directory exists
  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
  }

  // Check if pacts directory exists
  if (!fs.existsSync(pactsDir)) {
    console.error(`Pacts directory not found: ${pactsDir}`);
    console.error('Run "npm run pacts:pull" first to download/copy pact files.');
    process.exit(1);
  }

  const pactFiles = fs.readdirSync(pactsDir).filter((f) => f.endsWith('.json'));

  if (pactFiles.length === 0) {
    console.error(`No pact files found in ${pactsDir}`);
    console.error('Run "npm run pacts:pull" first to download/copy pact files.');
    process.exit(1);
  }

  for (const pactFile of pactFiles) {
    const pactPath = path.join(pactsDir, pactFile);
    console.log(`Processing: ${pactFile}...`);

    try {
      const pactContent = fs.readFileSync(pactPath, 'utf-8');
      const pact: PactContract = JSON.parse(pactContent);

      if (!pact.provider || !pact.provider.name) {
        console.warn(`⚠ Skipping ${pactFile}: missing provider name`);
        continue;
      }

      const provider = pact.provider.name;
      const environment = generateEnvironmentForProvider(provider, pact);

      const outputFile = path.join(generatedDir, `${provider}.json`);
      fs.writeFileSync(outputFile, JSON.stringify(environment, null, 2));

      console.log(`  ✓ Generated: ${outputFile}`);
      console.log(`    Port: ${environment.port}`);
      console.log(`    Routes: ${environment.routes.length}`);
    } catch (error: any) {
      console.error(`  ✗ Error processing ${pactFile}:`, error.message);
    }
  }

  console.log('\n✓ Mockoon environments generated successfully!');
  console.log(`\nGenerated files in: ${generatedDir}`);
  console.log('\nTo start mocks, run: npm run mocks:start');
}

main().catch((error) => {
  console.error('Error generating Mockoon environments:', error);
  process.exit(1);
});
