import express, { Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import { calculatePricing } from "./pricing";

const app = express();
const PORT = process.env.PORT || 4003;

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

/**
 * @openapi
 * /pricing/quote:
 *   get:
 *     summary: Calculate a pricing quote for a product and user
 *     description: >
 *       Returns a pricing quote based on base price and the user's loyalty tier.
 *       Discount rules are implemented in the pricing domain layer.
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
 *       - in: query
 *         name: basePrice
 *         required: true
 *         schema:
 *           type: number
 *         description: Base price of the product
 *       - in: query
 *         name: loyaltyTier
 *         required: true
 *         schema:
 *           type: string
 *           enum: [BRONZE, SILVER, GOLD]
 *         description: User loyalty tier used to calculate discount
 *     responses:
 *       200:
 *         description: Calculated pricing quote
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 productId:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 basePrice:
 *                   type: number
 *                 discount:
 *                   type: number
 *                 finalPrice:
 *                   type: number
 *                 currency:
 *                   type: string
 *       400:
 *         description: Invalid or missing query parameters
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
app.get("/pricing/quote", (req: Request, res: Response) => {
  const { productId, userId, basePrice, loyaltyTier } = req.query;

  if (!productId || !userId || !basePrice || !loyaltyTier) {
    res.status(400).json({
      error: "INVALID_REQUEST",
      message:
        "productId, userId, basePrice and loyaltyTier query parameters are required"
    });
    return;
  }

  const basePriceNumber = Number(basePrice);

  if (Number.isNaN(basePriceNumber) || basePriceNumber <= 0) {
    res.status(400).json({
      error: "INVALID_BASE_PRICE",
      message: "basePrice must be a positive number"
    });
    return;
  }

  const quote = calculatePricing(
    String(productId),
    String(userId),
    basePriceNumber,
    String(loyaltyTier)
  );

  res.json(quote);
});

app.listen(PORT, () => {
  console.log(`Pricing API listening on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/docs`);
});