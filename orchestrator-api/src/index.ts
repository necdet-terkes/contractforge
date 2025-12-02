import express, { Request, Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import { fetchProductById, fetchAllProducts } from "./inventoryClient";
import { fetchUserById, fetchAllUsers } from "./userClient";
import { fetchPricingQuote } from "./pricingClient";

const app = express();
const PORT = process.env.PORT || 4000;

// CORS for local UI (Vite)
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
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "orchestrator-api" });
});

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
app.get("/catalog/products", async (_req: Request, res: Response) => {
  try {
    const products = await fetchAllProducts();
    res.json(products);
  } catch (error: any) {
    console.error("Error while fetching product list:", error.message);
    res.status(502).json({
      error: "INVENTORY_UNAVAILABLE",
      message: "Could not retrieve product list from inventory-api"
    });
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
app.get("/catalog/users", async (_req: Request, res: Response) => {
  try {
    const users = await fetchAllUsers();
    res.json(users);
  } catch (error: any) {
    console.error("Error while fetching user list:", error.message);
    res.status(502).json({
      error: "USER_SERVICE_UNAVAILABLE",
      message: "Could not retrieve user list from user-api"
    });
  }
});

/**
 * @openapi
 * /checkout/preview:
 *   get:
 *     summary: Get a checkout preview for a product and user
 *     description: >
 *       Orchestrates data from inventory-api, user-api and pricing-api to build
 *       a combined checkout preview. The orchestrator does not contain business
 *       pricing rules; those are delegated to pricing-api.
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product identifier
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User identifier
 *     responses:
 *       200:
 *         description: Checkout preview combining product, user and pricing information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     stock:
 *                       type: integer
 *                     basePrice:
 *                       type: number
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     loyaltyTier:
 *                       type: string
 *                       enum: [BRONZE, SILVER, GOLD]
 *                 pricing:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     basePrice:
 *                       type: number
 *                     discount:
 *                       type: number
 *                     finalPrice:
 *                       type: number
 *                     currency:
 *                       type: string
 *       400:
 *         description: Missing or invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *       404:
 *         description: Product or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *       502:
 *         description: One or more upstream services are unavailable
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
app.get(
  "/checkout/preview",
  async (req: Request, res: Response): Promise<void> => {
    const { productId, userId } = req.query;

    if (!productId || !userId) {
      res.status(400).json({
        error: "INVALID_REQUEST",
        message: "productId and userId query parameters are required"
      });
      return;
    }

    try {
      const product = await fetchProductById(String(productId));
      const user = await fetchUserById(String(userId));

      // Delegate pricing to pricing-api
      const pricing = await fetchPricingQuote({
        productId: product.id,
        userId: user.id,
        basePrice: product.price,
        loyaltyTier: user.loyaltyTier
      });

      const preview = {
        product: {
          id: product.id,
          name: product.name,
          stock: product.stock,
          basePrice: product.price
        },
        user: {
          id: user.id,
          name: user.name,
          loyaltyTier: user.loyaltyTier
        },
        pricing
      };

      res.json(preview);
    } catch (error: any) {
      if (error.code === "PRODUCT_NOT_FOUND") {
        res.status(404).json({
          error: "PRODUCT_NOT_FOUND",
          message: error.message
        });
        return;
      }

      if (error.code === "USER_NOT_FOUND") {
        res.status(404).json({
          error: "USER_NOT_FOUND",
          message: error.message
        });
        return;
      }

      if (error.code === "PRICING_API_ERROR") {
        res.status(502).json({
          error: "PRICING_API_ERROR",
          message: error.message
        });
        return;
      }

      console.error("Error in checkout preview:", error.message);

      res.status(502).json({
        error: "UPSTREAM_UNAVAILABLE",
        message: "Could not retrieve data from one or more upstream services"
      });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Orchestrator API listening on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/docs`);
});