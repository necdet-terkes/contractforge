// pricing-api/src/index.ts

import express, { Request, Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import { config } from "./config";
import pricingRouter from "./routes/pricing";
import rulesRouter from "./routes/rules";

export const app = express();

app.use(
  cors({
    origin: config.corsOrigin
  })
);
app.use(express.json());

// Swagger UI
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check for the pricing service
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 service:
 *                   type: string
 */
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "pricing-api" });
});

app.use(pricingRouter);
app.use(rulesRouter);

if (process.env.NODE_ENV !== "test") {
  app.listen(config.port, () => {
    console.log(`Pricing API listening on port ${config.port}`);
    console.log(`Swagger docs available at http://localhost:${config.port}/docs`);
  });
}
