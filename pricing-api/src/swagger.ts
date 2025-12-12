import swaggerJsdoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Pricing API",
    version: "1.0.0",
    description: "Pricing service for ContractForge POC"
  },
  servers: [
    {
      url: "http://localhost:4003",
      description: "Local development server"
    }
  ]
};

export const swaggerOptions: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: [
    "./src/index.ts",
    "./src/routes/pricing.ts",
    "./src/routes/rules.ts"
  ]
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);