// pricing-api/src/routes/pricing.ts

import { Request, Response, Router } from 'express';
import { calculatePricing } from '../pricing';
import { validateLoyaltyTier } from '../../../types/utils/validation';
import { validateBasePrice } from '../utils/validation';
import { createErrorResponse } from '../../../types/utils/errors';

const router = Router();

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
router.get('/pricing/quote', async (req: Request, res: Response) => {
  const { productId, userId, basePrice, loyaltyTier } = req.query;

  if (!productId || !userId || !basePrice || !loyaltyTier) {
    createErrorResponse(
      res,
      'INVALID_REQUEST',
      'productId, userId, basePrice and loyaltyTier query parameters are required',
      400
    );
    return;
  }

  const basePriceValidation = validateBasePrice(basePrice);
  if (!basePriceValidation.valid) {
    createErrorResponse(
      res,
      basePriceValidation.error!.code,
      basePriceValidation.error!.message,
      400
    );
    return;
  }

  const tierValidation = validateLoyaltyTier(loyaltyTier);
  if (!tierValidation.valid) {
    createErrorResponse(res, tierValidation.error!.code, tierValidation.error!.message, 400);
    return;
  }

  try {
    const quote = await calculatePricing(
      String(productId),
      String(userId),
      basePriceValidation.value!,
      tierValidation.value!
    );

    res.json(quote);
  } catch (error: any) {
    console.error('Error while calculating pricing:', error);
    createErrorResponse(
      res,
      'INTERNAL_ERROR',
      'Unexpected error while calculating pricing quote',
      500
    );
  }
});

export default router;
