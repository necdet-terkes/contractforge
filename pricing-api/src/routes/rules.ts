// pricing-api/src/routes/rules.ts

import { Request, Response, Router } from 'express';
import {
  listDiscountRules,
  findDiscountRuleById,
  createDiscountRule,
  updateDiscountRule,
  deleteDiscountRule,
} from '../discountRuleRepository';
import { validateLoyaltyTier } from '../../../types/utils/validation';
import { validateRate } from '../utils/validation';
import { createErrorResponse } from '../../../types/utils/errors';

const router = Router();

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
router.get('/pricing/rules', async (_req: Request, res: Response) => {
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
router.get('/pricing/rules/:id', async (req: Request, res: Response) => {
  const rule = await findDiscountRuleById(req.params.id);

  if (!rule) {
    createErrorResponse(
      res,
      'RULE_NOT_FOUND',
      `Discount rule with id '${req.params.id}' not found`,
      404
    );
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
router.post('/pricing/rules', async (req: Request, res: Response) => {
  const { id, loyaltyTier, rate, description, active } = req.body ?? {};

  if (id == null || loyaltyTier == null || rate == null) {
    createErrorResponse(res, 'INVALID_PAYLOAD', 'id, loyaltyTier and rate are required', 400);
    return;
  }

  const tierValidation = validateLoyaltyTier(loyaltyTier);
  if (!tierValidation.valid) {
    createErrorResponse(res, tierValidation.error!.code, tierValidation.error!.message, 400);
    return;
  }

  const rateValidation = validateRate(rate);
  if (!rateValidation.valid) {
    createErrorResponse(res, rateValidation.error!.code, rateValidation.error!.message, 400);
    return;
  }

  try {
    const rule = await createDiscountRule({
      id: String(id),
      loyaltyTier: tierValidation.value!,
      rate: rateValidation.value!,
      description: description ? String(description) : undefined,
      active: active != null ? Boolean(active) : undefined,
    });

    res.status(201).json(rule);
  } catch (error: any) {
    if (error.code === 'RULE_ALREADY_EXISTS') {
      createErrorResponse(res, 'RULE_ALREADY_EXISTS', error.message, 409);
      return;
    }

    if (error.code === 'INVALID_RATE') {
      createErrorResponse(res, 'INVALID_RATE', error.message, 400);
      return;
    }

    console.error('Error while creating discount rule:', error);
    createErrorResponse(
      res,
      'INTERNAL_ERROR',
      'Unexpected error while creating discount rule',
      500
    );
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
router.put('/pricing/rules/:id', async (req: Request, res: Response) => {
  const { loyaltyTier, rate, description, active } = req.body ?? {};

  if (loyaltyTier == null && rate == null && description == null && active == null) {
    createErrorResponse(
      res,
      'INVALID_PAYLOAD',
      'At least one of loyaltyTier, rate, description or active must be provided',
      400
    );
    return;
  }

  const updates: any = {};

  if (loyaltyTier != null) {
    const tierValidation = validateLoyaltyTier(loyaltyTier);
    if (!tierValidation.valid) {
      createErrorResponse(res, tierValidation.error!.code, tierValidation.error!.message, 400);
      return;
    }
    updates.loyaltyTier = tierValidation.value;
  }

  if (rate != null) {
    const rateValidation = validateRate(rate);
    if (!rateValidation.valid) {
      createErrorResponse(res, rateValidation.error!.code, rateValidation.error!.message, 400);
      return;
    }
    updates.rate = rateValidation.value;
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
    if (error.code === 'RULE_NOT_FOUND') {
      createErrorResponse(res, 'RULE_NOT_FOUND', error.message, 404);
      return;
    }

    if (error.code === 'INVALID_RATE') {
      createErrorResponse(res, 'INVALID_RATE', error.message, 400);
      return;
    }

    console.error('Error while updating discount rule:', error);
    createErrorResponse(
      res,
      'INTERNAL_ERROR',
      'Unexpected error while updating discount rule',
      500
    );
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
router.delete('/pricing/rules/:id', async (req: Request, res: Response) => {
  try {
    await deleteDiscountRule(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'RULE_NOT_FOUND') {
      createErrorResponse(res, 'RULE_NOT_FOUND', error.message, 404);
      return;
    }

    console.error('Error while deleting discount rule:', error);
    createErrorResponse(
      res,
      'INTERNAL_ERROR',
      'Unexpected error while deleting discount rule',
      500
    );
  }
});

export default router;
