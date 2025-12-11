// user-api/src/config.ts

export const config = {
  port: Number(process.env.PORT) || 4002,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173"
};

