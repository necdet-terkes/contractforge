import swaggerJsdoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "User API",
    version: "1.0.0",
    description: "User service for ContractForge POC"
  },
  servers: [
    {
      url: "http://localhost:4002",
      description: "Local development server"
    }
  ]
};

export const swaggerOptions: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: [
    "./src/index.ts",
    "./src/routes/users.ts"
  ]
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);