// pricing-api/src/index.ts

import express, { Request, Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import { calculatePricing } from "./pricing";
import { LoyaltyTier } from "./discountRules";
import {
  listDiscountRules,
  findDiscountRuleById,
  createDiscountRule,
  updateDiscountRule,
  deleteDiscountRule
} from "./discountRuleRepository";

const app = express();
const PORT = process.env.PORT || 4003;

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
 *       Discount rules are resolved from the in-memory discount rule repository.
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
 *         description: User loyalty tier used to resolve discount rules
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
app.get("/pricing/quote", async (req: Request, res: Response) => {
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

  const tier = String(loyaltyTier).toUpperCase() as LoyaltyTier;

  if (!["BRONZE", "SILVER", "GOLD"].includes(tier)) {
    res.status(400).json({
      error: "INVALID_TIER",
      message: "loyaltyTier must be one of BRONZE, SILVER or GOLD"
    });
    return;
  }

  try {
    const quote = await calculatePricing(
      String(productId),
      String(userId),
      basePriceNumber,
      tier
    );

    res.json(quote);
  } catch (error: any) {
    console.error("Error while calculating pricing:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Unexpected error while calculating pricing quote"
    });
  }
});

/**
 * @openapi
 * /pricing/rules:
 *   get:
 *     summary: List all discount rules
 *     description: Returns the current set of discount rules used for pricing.
 *     responses:
 *       200:
 *         description: A list of discount rules
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   loyaltyTier:
 *                     type: string
 *                     enum: [BRONZE, SILVER, GOLD]
 *                   rate:
 *                     type: number
 *                     description: Discount rate between 0 and 1
 *                   description:
 *                     type: string
 *                   active:
 *                     type: boolean
 */
app.get("/pricing/rules", async (_req: Request, res: Response) => {
  const rules = await listDiscountRules();
  res.json(rules);
});

/**
 * @openapi
 * /pricing/rules/{id}:
 *   get:
 *     summary: Get a single discount rule by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Discount rule identifier
 *     responses:
 *       200:
 *         description: Discount rule found
 *       404:
 *         description: Discount rule not found
 */
app.get("/pricing/rules/:id", async (req: Request, res: Response) => {
  const rule = await findDiscountRuleById(req.params.id);

  if (!rule) {
    res.status(404).json({
      error: "RULE_NOT_FOUND",
      message: `Discount rule with id '${req.params.id}' not found`
    });
    return;
  }

  res.json(rule);
});

/**
 * @openapi
 * /pricing/rules:
 *   post:
 *     summary: Create a new discount rule
 *     description: >
 *       Creates a new discount rule in the in-memory repository.
 *       The ID must be unique. The rate must be between 0 and 1.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - loyaltyTier
 *               - rate
 *             properties:
 *               id:
 *                 type: string
 *               loyaltyTier:
 *                 type: string
 *                 enum: [BRONZE, SILVER, GOLD]
 *               rate:
 *                 type: number
 *                 description: Discount rate between 0 and 1
 *               description:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Discount rule created
 *       400:
 *         description: Invalid payload
 *       409:
 *         description: Rule with the same ID already exists
 */
app.post("/pricing/rules", async (req: Request, res: Response) => {
  const { id, loyaltyTier, rate, description, active } = req.body ?? {};

  if (id == null || loyaltyTier == null || rate == null) {
    res.status(400).json({
      error: "INVALID_PAYLOAD",
      message: "id, loyaltyTier and rate are required"
    });
    return;
  }

  const normalizedTier = String(loyaltyTier).toUpperCase() as LoyaltyTier;
  if (!["BRONZE", "SILVER", "GOLD"].includes(normalizedTier)) {
    res.status(400).json({
      error: "INVALID_TIER",
      message: "loyaltyTier must be one of BRONZE, SILVER or GOLD"
    });
    return;
  }

  const rateNumber = Number(rate);
  if (Number.isNaN(rateNumber) || rateNumber < 0 || rateNumber > 1) {
    res.status(400).json({
      error: "INVALID_RATE",
      message: "rate must be a number between 0 and 1"
    });
    return;
  }

  try {
    const rule = await createDiscountRule({
      id: String(id),
      loyaltyTier: normalizedTier,
      rate: rateNumber,
      description: description ? String(description) : undefined,
      active: active != null ? Boolean(active) : undefined
    });

    res.status(201).json(rule);
  } catch (error: any) {
    if (error.code === "RULE_ALREADY_EXISTS") {
      res.status(409).json({
        error: "RULE_ALREADY_EXISTS",
        message: error.message
      });
      return;
    }

    if (error.code === "INVALID_RATE") {
      res.status(400).json({
        error: "INVALID_RATE",
        message: error.message
      });
      return;
    }

    console.error("Error while creating discount rule:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Unexpected error while creating discount rule"
    });
  }
});

/**
 * @openapi
 * /pricing/rules/{id}:
 *   put:
 *     summary: Update an existing discount rule
 *     description: >
 *       Updates the loyalty tier, rate, description and/or active flag of an existing rule.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Discount rule identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               loyaltyTier:
 *                 type: string
 *                 enum: [BRONZE, SILVER, GOLD]
 *               rate:
 *                 type: number
 *               description:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Discount rule updated
 *       400:
 *         description: Invalid payload
 *       404:
 *         description: Discount rule not found
 */
app.put("/pricing/rules/:id", async (req: Request, res: Response) => {
  const { loyaltyTier, rate, description, active } = req.body ?? {};

  if (
    loyaltyTier == null &&
    rate == null &&
    description == null &&
    active == null
  ) {
    res.status(400).json({
      error: "INVALID_PAYLOAD",
      message:
        "At least one of loyaltyTier, rate, description or active must be provided"
    });
    return;
  }

  const updates: any = {};

  if (loyaltyTier != null) {
    const normalizedTier = String(loyaltyTier).toUpperCase();
    if (!["BRONZE", "SILVER", "GOLD"].includes(normalizedTier)) {
      res.status(400).json({
        error: "INVALID_TIER",
        message: "loyaltyTier must be one of BRONZE, SILVER or GOLD"
      });
      return;
    }
    updates.loyaltyTier = normalizedTier as LoyaltyTier;
  }

  if (rate != null) {
    const rateNumber = Number(rate);
    if (Number.isNaN(rateNumber) || rateNumber < 0 || rateNumber > 1) {
      res.status(400).json({
        error: "INVALID_RATE",
        message: "rate must be a number between 0 and 1"
      });
      return;
    }
    updates.rate = rateNumber;
  }

  if (description != null) {
    updates.description = String(description);
  }

  if (active != null) {
    updates.active = Boolean(active);
  }

  try {
    const updated = await updateDiscountRule(req.params.id, updates);
    res.json(updated);
  } catch (error: any) {
    if (error.code === "RULE_NOT_FOUND") {
      res.status(404).json({
        error: "RULE_NOT_FOUND",
        message: error.message
      });
      return;
    }

    if (error.code === "INVALID_RATE") {
      res.status(400).json({
        error: "INVALID_RATE",
        message: error.message
      });
      return;
    }

    console.error("Error while updating discount rule:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Unexpected error while updating discount rule"
    });
  }
});

/**
 * @openapi
 * /pricing/rules/{id}:
 *   delete:
 *     summary: Delete a discount rule
 *     description: >
 *       Removes a discount rule from the in-memory repository.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Discount rule identifier
 *     responses:
 *       204:
 *         description: Discount rule deleted successfully
 *       404:
 *         description: Discount rule not found
 */
app.delete("/pricing/rules/:id", async (req: Request, res: Response) => {
  try {
    await deleteDiscountRule(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === "RULE_NOT_FOUND") {
      res.status(404).json({
        error: "RULE_NOT_FOUND",
        message: error.message
      });
      return;
    }

    console.error("Error while deleting discount rule:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Unexpected error while deleting discount rule"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Pricing API listening on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/docs`);
});
