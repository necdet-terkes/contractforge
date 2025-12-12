import swaggerJsdoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Inventory API",
    version: "1.0.0",
    description: "Inventory service for ContractForge POC"
  },
  servers: [
    {
      url: "http://localhost:4001",
      description: "Local development server"
    }
  ]
};

export const swaggerOptions: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: [
    "./src/index.ts",
    "./src/routes/products.ts"
  ]
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);