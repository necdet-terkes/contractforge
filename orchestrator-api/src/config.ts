// orchestrator-api/src/config.ts

export const config = {
  port: Number(process.env.PORT) || 4000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  inventoryApiUrl: process.env.INVENTORY_API_URL || 'http://localhost:4001',
  userApiUrl: process.env.USER_API_URL || 'http://localhost:4002',
  pricingApiUrl: process.env.PRICING_API_URL || 'http://localhost:4003',
};
