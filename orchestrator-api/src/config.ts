// orchestrator-api/src/config.ts

const isMockMode = process.env.MOCK_MODE === 'true';

// Mock ports (Mockoon)
const MOCK_PORTS = {
  inventory: 5001,
  user: 5002,
  pricing: 5003,
};

// Real API ports
const REAL_PORTS = {
  inventory: 4001,
  user: 4002,
  pricing: 4003,
};

const getApiUrl = (service: keyof typeof MOCK_PORTS, envVar?: string): string => {
  if (envVar) {
    return envVar;
  }
  const port = isMockMode ? MOCK_PORTS[service] : REAL_PORTS[service];
  return `http://localhost:${port}`;
};

export const config = {
  port: Number(process.env.PORT) || 4000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  isMockMode,
  inventoryApiUrl: getApiUrl('inventory', process.env.INVENTORY_API_URL),
  userApiUrl: getApiUrl('user', process.env.USER_API_URL),
  pricingApiUrl: getApiUrl('pricing', process.env.PRICING_API_URL),
};
