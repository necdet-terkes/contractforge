// user-api/src/index.ts

import express, { Request, Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import { config } from "./config";
import usersRouter from "./routes/users";

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
 *     summary: Health check for the user service
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
  res.json({ status: "ok", service: "user-api" });
});

app.use(usersRouter);

if (process.env.NODE_ENV !== "test") {
  app.listen(config.port, () => {
    console.log(`User API listening on port ${config.port}`);
    console.log(`Swagger docs available at http://localhost:${config.port}/docs`);
  });
}
