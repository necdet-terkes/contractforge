// inventory-api/src/index.ts

import express, { Request, Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import {
  listProducts,
  findProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from "./productRepository";

const app = express();
const PORT = process.env.PORT || 4001;

app.use(
  cors({
    origin: "http://localhost:5173"
  })
);
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
 *     description: Returns the current product catalog from the in-memory repository.
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
app.get("/products", async (_req: Request, res: Response) => {
  const products = await listProducts();
  res.json(products);
});

/**
 * @openapi
 * /products/{id}:
 *   get:
 *     summary: Get a single product by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product identifier
 *     responses:
 *       200:
 *         description: Product found
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
app.get("/products/:id", async (req: Request, res: Response) => {
  const product = await findProductById(req.params.id);

  if (!product) {
    res.status(404).json({
      error: "PRODUCT_NOT_FOUND",
      message: `Product with id '${req.params.id}' not found`
    });
    return;
  }

  res.json(product);
});

/**
 * @openapi
 * /products:
 *   post:
 *     summary: Create a new product
 *     description: >
 *       Creates a new product in the in-memory repository.
 *       The ID must be unique.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - name
 *               - stock
 *               - price
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               stock:
 *                 type: integer
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Product created
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
 *       400:
 *         description: Invalid payload
 *       409:
 *         description: Product with the same ID already exists
 */
app.post("/products", async (req: Request, res: Response) => {
  const { id, name, stock, price } = req.body ?? {};

  if (id == null || name == null || stock == null || price == null) {
    res.status(400).json({
      error: "INVALID_PAYLOAD",
      message: "id, name, stock and price are required"
    });
    return;
  }

  const stockNumber = Number(stock);
  const priceNumber = Number(price);

  if (!Number.isInteger(stockNumber) || stockNumber < 0) {
    res.status(400).json({
      error: "INVALID_STOCK",
      message: "stock must be a non-negative integer"
    });
    return;
  }

  if (Number.isNaN(priceNumber) || priceNumber <= 0) {
    res.status(400).json({
      error: "INVALID_PRICE",
      message: "price must be a positive number"
    });
    return;
  }

  try {
    const product = await createProduct({
      id: String(id),
      name: String(name),
      stock: stockNumber,
      price: priceNumber
    });

    res.status(201).json(product);
  } catch (error: any) {
    if (error.code === "PRODUCT_ALREADY_EXISTS") {
      res.status(409).json({
        error: "PRODUCT_ALREADY_EXISTS",
        message: error.message
      });
      return;
    }

    if (error.code === "INVALID_STOCK" || error.code === "INVALID_PRICE") {
      res.status(400).json({
        error: error.code,
        message: error.message
      });
      return;
    }

    console.error("Error while creating product:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Unexpected error while creating product"
    });
  }
});

/**
 * @openapi
 * /products/{id}:
 *   put:
 *     summary: Update an existing product
 *     description: >
 *       Updates the name, stock and/or price of an existing product.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               stock:
 *                 type: integer
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product updated
 *       400:
 *         description: Invalid payload
 *       404:
 *         description: Product not found
 */
app.put("/products/:id", async (req: Request, res: Response) => {
  const { name, stock, price } = req.body ?? {};

  if (name == null && stock == null && price == null) {
    res.status(400).json({
      error: "INVALID_PAYLOAD",
      message: "At least one of name, stock or price must be provided"
    });
    return;
  }

  const updates: any = {};

  if (name != null) {
    updates.name = String(name);
  }

  if (stock != null) {
    const stockNumber = Number(stock);
    if (!Number.isInteger(stockNumber) || stockNumber < 0) {
      res.status(400).json({
        error: "INVALID_STOCK",
        message: "stock must be a non-negative integer"
      });
      return;
    }
    updates.stock = stockNumber;
  }

  if (price != null) {
    const priceNumber = Number(price);
    if (Number.isNaN(priceNumber) || priceNumber <= 0) {
      res.status(400).json({
        error: "INVALID_PRICE",
        message: "price must be a positive number"
      });
      return;
    }
    updates.price = priceNumber;
  }

  try {
    const updated = await updateProduct(req.params.id, updates);
    res.json(updated);
  } catch (error: any) {
    if (error.code === "PRODUCT_NOT_FOUND") {
      res.status(404).json({
        error: "PRODUCT_NOT_FOUND",
        message: error.message
      });
      return;
    }

    if (error.code === "INVALID_STOCK" || error.code === "INVALID_PRICE") {
      res.status(400).json({
        error: error.code,
        message: error.message
      });
      return;
    }

    console.error("Error while updating product:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Unexpected error while updating product"
    });
  }
});

/**
 * @openapi
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     description: >
 *       Removes a product from the in-memory repository.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product identifier
 *     responses:
 *       204:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
app.delete("/products/:id", async (req: Request, res: Response) => {
  try {
    await deleteProduct(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === "PRODUCT_NOT_FOUND") {
      res.status(404).json({
        error: "PRODUCT_NOT_FOUND",
        message: error.message
      });
      return;
    }

    console.error("Error while deleting product:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Unexpected error while deleting product"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Inventory API listening on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/docs`);
});
