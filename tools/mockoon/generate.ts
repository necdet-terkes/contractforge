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
  type: string;
  method: string;
  endpoint: string;
  documentation: string;
  responseMode: string;
  streamingMode: string;
  streamingInterval: number;
  responses: Array<{
    uuid: string;
    statusCode: number;
    label?: string;
    default?: boolean;
    headers: Array<{ key: string; value: string }>;
    body?: string;
    bodyType: string;
    latency: number;
    filePath: string;
    databucketID: string;
    sendFileAsBody: boolean;
    rules: Array<any>;
    rulesOperator: string;
    disableTemplating: boolean;
    fallbackTo404: boolean;
    crudKey: string;
    callbacks: Array<any>;
  }>;
}

interface MockoonHeader {
  key: string;
  value: string;
}

interface MockoonEnvironment {
  uuid: string;
  lastMigration: number;
  name: string;
  port: number;
  hostname: string;
  endpointPrefix: string;
  latency: number;
  rootChildren: Array<any>;
  folders: Array<any>;
  routes: MockoonRoute[];
  headers?: MockoonHeader[];
  cors: boolean;
  proxyMode: boolean;
  proxyHost: string;
  proxyRemovePrefix: boolean;
  proxyReqHeaders: Array<any>;
  proxyResHeaders: Array<any>;
  data: Array<any>;
  callbacks: Array<any>;
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
  // Mockoon uses :id format for path parameters (not {id})
  // If path already has :id format, keep it; otherwise convert fixed paths to :id
  const params: string[] = [];

  // If path already has :param format, use it as-is
  if (pathStr.includes(':')) {
    const matches = pathStr.matchAll(/:(\w+)/g);
    for (const match of matches) {
      params.push(match[1]);
    }
    return { path: pathStr, params };
  }

  // Otherwise, try to normalize fixed paths to parameterized format
  // This handles cases where Pact has /users/u1 but we need /users/:id
  return { path: pathStr, params };
}

function convertInteractionToRoute(interaction: PactInteraction): MockoonRoute {
  const { path: mockoonPath } = extractPathParams(interaction.request.path);

  // Mockoon matches routes by path only, query params are handled separately
  // So we don't include query string in the endpoint path
  const endpoint = mockoonPath;

  // Convert headers object to array format
  const headersArray: Array<{ key: string; value: string }> = [
    { key: 'Access-Control-Allow-Origin', value: '*' },
    { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS' },
    {
      key: 'Access-Control-Allow-Headers',
      value: 'Content-Type, Origin, Accept, Authorization, Content-Length, X-Requested-With',
    },
  ];

  // Add headers from interaction
  if (interaction.response.headers) {
    for (const [key, value] of Object.entries(interaction.response.headers)) {
      headersArray.push({ key, value });
    }
  }

  const response: MockoonRoute['responses'][0] = {
    uuid: uuidv4(),
    statusCode: interaction.response.status,
    label: interaction.description,
    default: true,
    headers: headersArray,
    bodyType: interaction.response.body ? 'INLINE' : 'INLINE',
    latency: 0,
    filePath: '',
    databucketID: '',
    sendFileAsBody: false,
    rules: [],
    rulesOperator: 'OR',
    disableTemplating: false,
    fallbackTo404: false,
    crudKey: 'id',
    callbacks: [],
  };

  // Add body if present
  if (interaction.response.body) {
    response.body = JSON.stringify(interaction.response.body, null, 2);
  }

  return {
    uuid: uuidv4(),
    type: 'http',
    method: interaction.request.method.toLowerCase(), // Mockoon expects lowercase
    endpoint,
    documentation: interaction.description,
    responseMode: 'null' as any,
    streamingMode: 'null' as any,
    streamingInterval: 0,
    responses: [response],
  };
}

function normalizePath(path: string): string {
  // Convert paths like /users/u1, /users/u2 to /users/:id (Mockoon uses :id format)
  // Convert paths like /products/p1, /products/p2 to /products/:id
  // Convert paths like /pricing/rules/rule-1 to /pricing/rules/:id

  // If path already has :param format, use it as-is
  if (path.includes(':')) {
    return path;
  }

  // Match patterns like /users/u1, /products/p1, /pricing/rules/rule-1
  const pathParamPatterns = [
    /^(\/users\/)u\d+$/,
    /^(\/products\/)p\d+$/,
    /^(\/pricing\/rules\/)rule-[\w-]+$/,
    /^(\/users\/)[\w-]+$/,
    /^(\/products\/)[\w-]+$/,
    /^(\/pricing\/rules\/)[\w-]+$/,
  ];

  for (const pattern of pathParamPatterns) {
    if (pattern.test(path)) {
      const match = path.match(pattern);
      if (match && match[1]) {
        return `${match[1]}:id`; // Mockoon uses :id, not {id}
      }
    }
  }

  // If no pattern matches, return path as-is
  return path;
}

function generateEnvironmentForProvider(provider: string, pact: PactContract): MockoonEnvironment {
  const routes: MockoonRoute[] = [];

  // Group interactions by method + normalized path to combine multiple responses
  const routeMap = new Map<string, MockoonRoute>();

  for (const interaction of pact.interactions) {
    // Normalize path to handle parameterized routes
    const normalizedPath = normalizePath(interaction.request.path);
    const routeKey = `${interaction.request.method}:${normalizedPath}`;

    if (routeMap.has(routeKey)) {
      // Add response to existing route
      const existingRoute = routeMap.get(routeKey)!;

      // Convert headers object to array format
      const headersArray: Array<{ key: string; value: string }> = [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS' },
        {
          key: 'Access-Control-Allow-Headers',
          value: 'Content-Type, Origin, Accept, Authorization, Content-Length, X-Requested-With',
        },
      ];

      // Add headers from interaction
      if (interaction.response.headers) {
        for (const [key, value] of Object.entries(interaction.response.headers)) {
          headersArray.push({ key, value });
        }
      }

      const response: MockoonRoute['responses'][0] = {
        uuid: uuidv4(),
        statusCode: interaction.response.status,
        label: interaction.description,
        default: existingRoute.responses.length === 0,
        headers: headersArray,
        bodyType: interaction.response.body ? 'INLINE' : 'INLINE',
        latency: 0,
        filePath: '',
        databucketID: '',
        sendFileAsBody: false,
        rules: [],
        rulesOperator: 'OR',
        disableTemplating: false,
        fallbackTo404: false,
        crudKey: 'id',
        callbacks: [],
      };

      if (interaction.response.body) {
        response.body = JSON.stringify(interaction.response.body, null, 2);
      }

      existingRoute.responses.push(response);
    } else {
      // Create new route with normalized path
      const route = convertInteractionToRoute(interaction);
      route.endpoint = normalizedPath; // Override with normalized path
      routeMap.set(routeKey, route);
    }
  }

  // Sort routes: more specific routes (with params) before general ones
  // This ensures /users/:id matches before /users/* if wildcards exist
  const sortedRoutes = Array.from(routeMap.values()).sort((a, b) => {
    // Routes with path params come after routes without
    const aHasParams = a.endpoint.includes(':');
    const bHasParams = b.endpoint.includes(':');
    if (aHasParams && !bHasParams) return 1;
    if (!aHasParams && bHasParams) return -1;
    // Same specificity, maintain order
    return 0;
  });

  routes.push(...sortedRoutes);

  return {
    uuid: uuidv4(),
    lastMigration: 29,
    name: `${provider} (Mock)`,
    port: PROVIDER_PORTS[provider] || 5000,
    hostname: '0.0.0.0',
    endpointPrefix: '',
    latency: 0,
    rootChildren: [],
    folders: [],
    routes,
    headers: [
      {
        key: 'Access-Control-Allow-Origin',
        value: '*',
      },
      {
        key: 'Access-Control-Allow-Methods',
        value: 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
      },
      {
        key: 'Access-Control-Allow-Headers',
        value: 'Content-Type, Origin, Accept, Authorization, Content-Length, X-Requested-With',
      },
    ],
    cors: true,
    proxyMode: false,
    proxyHost: '',
    proxyRemovePrefix: false,
    proxyReqHeaders: [],
    proxyResHeaders: [],
    data: [],
    callbacks: [],
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

  // Required providers that must be generated
  const requiredProviders = ['inventory-api', 'user-api', 'pricing-api'];
  const generatedProviders = new Set<string>();
  const errors: Array<{ file: string; error: string }> = [];

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
        const errorMsg = `missing provider name`;
        console.error(`  ✗ Error: ${errorMsg}`);
        errors.push({ file: pactFile, error: errorMsg });
        continue;
      }

      const provider = pact.provider.name;

      // Check if this is a required provider
      if (!requiredProviders.includes(provider)) {
        console.warn(`  ⚠ Skipping ${provider}: not a required provider`);
        continue;
      }

      const environment = generateEnvironmentForProvider(provider, pact);

      const outputFile = path.join(generatedDir, `${provider}.json`);
      fs.writeFileSync(outputFile, JSON.stringify(environment, null, 2));

      generatedProviders.add(provider);
      console.log(`  ✓ Generated: ${outputFile}`);
      console.log(`    Port: ${environment.port}`);
      console.log(`    Routes: ${environment.routes.length}`);
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      console.error(`  ✗ Error processing ${pactFile}: ${errorMsg}`);
      errors.push({ file: pactFile, error: errorMsg });
    }
  }

  // Verify all required providers were generated
  const missingProviders = requiredProviders.filter((p) => !generatedProviders.has(p));

  if (missingProviders.length > 0 || errors.length > 0) {
    console.error('\n✗ Mockoon environment generation failed!');
    if (missingProviders.length > 0) {
      console.error(`\nMissing required providers: ${missingProviders.join(', ')}`);
      console.error('Expected pact files:');
      missingProviders.forEach((provider) => {
        const expectedPact = `orchestrator-api-${provider}.json`;
        console.error(`  - ${expectedPact}`);
      });
    }
    if (errors.length > 0) {
      console.error('\nErrors encountered:');
      errors.forEach(({ file, error }) => {
        console.error(`  - ${file}: ${error}`);
      });
    }
    console.error('\nRun "npm run pacts:pull" to ensure all pact files are available.');
    process.exit(1);
  }

  // Verify all generated files exist
  const missingFiles = requiredProviders.filter((provider) => {
    const filePath = path.join(generatedDir, `${provider}.json`);
    return !fs.existsSync(filePath);
  });

  if (missingFiles.length > 0) {
    console.error(`\n✗ Generated files missing: ${missingFiles.join(', ')}`);
    process.exit(1);
  }

  console.log('\n✓ Mockoon environments generated successfully!');
  console.log(`\nGenerated files in: ${generatedDir}`);
  console.log('\nTo start mocks, run: npm run mocks:start');
}

main().catch((error) => {
  console.error('Error generating Mockoon environments:', error);
  process.exit(1);
});
