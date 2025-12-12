// src/config.ts

const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';

// Debug: Log mock mode status (only in development)
if (import.meta.env.DEV) {
  console.log('[Config] VITE_MOCK_MODE:', import.meta.env.VITE_MOCK_MODE);
  console.log('[Config] isMockMode:', isMockMode);
}

// Mock ports (Mockoon)
const MOCK_PORTS = {
  orchestrator: 4000, // Orchestrator still runs on 4000, but uses mock upstreams
  inventory: 5001,
  user: 5002,
  pricing: 5003,
};

// Real API ports
const REAL_PORTS = {
  orchestrator: 4000,
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

export const ORCHESTRATOR_BASE_URL =
  import.meta.env.VITE_ORCHESTRATOR_BASE_URL || getApiUrl('orchestrator');

export const INVENTORY_API_BASE_URL =
  import.meta.env.VITE_INVENTORY_API_URL || getApiUrl('inventory');

export const USER_API_BASE_URL = import.meta.env.VITE_USER_API_URL || getApiUrl('user');

export const PRICING_API_BASE_URL = import.meta.env.VITE_PRICING_API_URL || getApiUrl('pricing');

// Debug: Log API URLs (only in development)
if (import.meta.env.DEV) {
  console.log('[Config] INVENTORY_API_BASE_URL:', INVENTORY_API_BASE_URL);
  console.log('[Config] USER_API_BASE_URL:', USER_API_BASE_URL);
  console.log('[Config] PRICING_API_BASE_URL:', PRICING_API_BASE_URL);
}

export const IS_MOCK_MODE = isMockMode;

// Single placeholder product image
export const PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=60';
