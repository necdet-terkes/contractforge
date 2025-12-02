import swaggerJsdoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Orchestrator API",
    version: "1.0.0",
    description: "Orchestrator service for ContractForge POC"
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Local development server"
    }
  ]
};

export const swaggerOptions: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: ["./src/index.ts"]
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);