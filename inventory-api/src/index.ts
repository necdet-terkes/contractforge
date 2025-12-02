import express, { Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import { getProductById, products } from "./products";

const app = express();
const PORT = process.env.PORT || 4001;

app.use(express.json());

// Swagger UI
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check for the inventory service
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
  res.json({ status: "ok", service: "inventory-api" });
});

/**
 * @openapi
 * /products:
 *   get:
 *     summary: List all products
 *     responses:
 *       200:
 *         description: A list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   stock:
 *                     type: integer
 *                   price:
 *                     type: number
 */
app.get("/products", (_req: Request, res: Response) => {
  res.json(products);
});

/**
 * @openapi
 * /products/{id}:
 *   get:
 *     summary: Get a product by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product identifier
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 stock:
 *                   type: integer
 *                 price:
 *                   type: number
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 */
app.get("/products/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const product = getProductById(id);

  if (!product) {
    return res.status(404).json({
      error: "PRODUCT_NOT_FOUND",
      message: `Product with id '${id}' was not found`
    });
  }

  return res.json(product);
});

app.listen(PORT, () => {
  console.log(`Inventory API listening on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/docs`);
});