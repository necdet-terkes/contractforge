import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import { config } from './config';
import catalogRouter from './routes/catalog';
import checkoutRouter from './routes/checkout';

export const app = express();

// CORS for local UI (Vite)
app.use(
  cors({
    origin: config.corsOrigin,
  })
);

app.use(express.json());

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check for the orchestrator service
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
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'orchestrator-api' });
});

app.use(catalogRouter);
app.use(checkoutRouter);

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`Orchestrator API listening on port ${config.port}`);
    console.log(`Swagger docs available at http://localhost:${config.port}/docs`);
  });
}
