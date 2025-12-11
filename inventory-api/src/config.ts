// inventory-api/src/config.ts

export const config = {
  port: Number(process.env.PORT) || 4001,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173"
};

