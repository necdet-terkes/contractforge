// pricing-api/src/config.ts

export const config = {
  port: Number(process.env.PORT) || 4003,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
