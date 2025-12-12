// inventory-api/src/routes/products.ts

import { Request, Response, Router } from "express";
import {
  listProducts,
  findProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from "../productRepository";
import { createErrorResponse } from "../../../types/utils/errors";
import { validateStock, validatePrice } from "../utils/validation";

const router = Router();

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
router.get("/products", async (_req: Request, res: Response) => {
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
router.get("/products/:id", async (req: Request, res: Response) => {
  const product = await findProductById(req.params.id);

  if (!product) {
    createErrorResponse(
      res,
      "PRODUCT_NOT_FOUND",
      `Product with id '${req.params.id}' not found`,
      404
    );
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
router.post("/products", async (req: Request, res: Response) => {
  const { id, name, stock, price } = req.body ?? {};

  if (id == null || name == null || stock == null || price == null) {
    createErrorResponse(
      res,
      "INVALID_PAYLOAD",
      "id, name, stock and price are required",
      400
    );
    return;
  }

  const stockValidation = validateStock(stock);
  if (!stockValidation.valid) {
    createErrorResponse(
      res,
      stockValidation.error!.code,
      stockValidation.error!.message,
      400
    );
    return;
  }

  const priceValidation = validatePrice(price);
  if (!priceValidation.valid) {
    createErrorResponse(
      res,
      priceValidation.error!.code,
      priceValidation.error!.message,
      400
    );
    return;
  }

  try {
    const product = await createProduct({
      id: String(id),
      name: String(name),
      stock: stockValidation.value!,
      price: priceValidation.value!
    });

    res.status(201).json(product);
  } catch (error: any) {
    if (error.code === "PRODUCT_ALREADY_EXISTS") {
      createErrorResponse(res, "PRODUCT_ALREADY_EXISTS", error.message, 409);
      return;
    }

    if (error.code === "INVALID_STOCK" || error.code === "INVALID_PRICE") {
      createErrorResponse(res, error.code, error.message, 400);
      return;
    }

    console.error("Error while creating product:", error);
    createErrorResponse(
      res,
      "INTERNAL_ERROR",
      "Unexpected error while creating product",
      500
    );
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
router.put("/products/:id", async (req: Request, res: Response) => {
  const { name, stock, price } = req.body ?? {};

  if (name == null && stock == null && price == null) {
    createErrorResponse(
      res,
      "INVALID_PAYLOAD",
      "At least one of name, stock or price must be provided",
      400
    );
    return;
  }

  const updates: any = {};

  if (name != null) {
    updates.name = String(name);
  }

  if (stock != null) {
    const stockValidation = validateStock(stock);
    if (!stockValidation.valid) {
      createErrorResponse(
        res,
        stockValidation.error!.code,
        stockValidation.error!.message,
        400
      );
      return;
    }
    updates.stock = stockValidation.value;
  }

  if (price != null) {
    const priceValidation = validatePrice(price);
    if (!priceValidation.valid) {
      createErrorResponse(
        res,
        priceValidation.error!.code,
        priceValidation.error!.message,
        400
      );
      return;
    }
    updates.price = priceValidation.value;
  }

  try {
    const updated = await updateProduct(req.params.id, updates);
    res.json(updated);
  } catch (error: any) {
    if (error.code === "PRODUCT_NOT_FOUND") {
      createErrorResponse(res, "PRODUCT_NOT_FOUND", error.message, 404);
      return;
    }

    if (error.code === "INVALID_STOCK" || error.code === "INVALID_PRICE") {
      createErrorResponse(res, error.code, error.message, 400);
      return;
    }

    console.error("Error while updating product:", error);
    createErrorResponse(
      res,
      "INTERNAL_ERROR",
      "Unexpected error while updating product",
      500
    );
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
router.delete("/products/:id", async (req: Request, res: Response) => {
  try {
    await deleteProduct(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === "PRODUCT_NOT_FOUND") {
      createErrorResponse(res, "PRODUCT_NOT_FOUND", error.message, 404);
      return;
    }

    console.error("Error while deleting product:", error);
    createErrorResponse(
      res,
      "INTERNAL_ERROR",
      "Unexpected error while deleting product",
      500
    );
  }
});

export default router;


