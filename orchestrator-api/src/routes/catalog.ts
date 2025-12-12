// orchestrator-api/src/routes/catalog.ts

import { Request, Response, Router } from "express";
import { fetchAllProducts } from "../inventoryClient";
import { fetchAllUsers } from "../userClient";
import { createErrorResponse } from "../../../types/utils/errors";

const router = Router();

/**
 * @openapi
 * /catalog/products:
 *   get:
 *     summary: Retrieve the product catalog
 *     description: Proxies the product list from inventory-api.
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
 *       502:
 *         description: Upstream inventory-api is unavailable
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
router.get("/catalog/products", async (_req: Request, res: Response) => {
  try {
    const products = await fetchAllProducts();
    res.json(products);
  } catch (error: any) {
    console.error("Error while fetching product list:", error.message);
    createErrorResponse(
      res,
      "INVENTORY_UNAVAILABLE",
      "Could not retrieve product list from inventory-api",
      502
    );
  }
});

/**
 * @openapi
 * /catalog/users:
 *   get:
 *     summary: Retrieve the user catalog
 *     description: Proxies the user list from user-api.
 *     responses:
 *       200:
 *         description: A list of users
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
 *                   loyaltyTier:
 *                     type: string
 *                     enum: [BRONZE, SILVER, GOLD]
 *       502:
 *         description: Upstream user-api is unavailable
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
router.get("/catalog/users", async (_req: Request, res: Response) => {
  try {
    const users = await fetchAllUsers();
    res.json(users);
  } catch (error: any) {
    console.error("Error while fetching user list:", error.message);
    createErrorResponse(
      res,
      "USER_SERVICE_UNAVAILABLE",
      "Could not retrieve user list from user-api",
      502
    );
  }
});

export default router;


