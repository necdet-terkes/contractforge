// orchestrator-api/src/routes/checkout.ts

import { Request, Response, Router } from 'express';
import { fetchProductById } from '../inventoryClient';
import { fetchUserById } from '../userClient';
import { fetchPricingQuote } from '../pricingClient';
import { createErrorResponse } from '../../../types/utils/errors';
import { buildCheckoutPreview, mapCheckoutError } from '../checkoutLogic';

const router = Router();

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
router.get('/checkout/preview', async (req: Request, res: Response): Promise<void> => {
  const { productId, userId } = req.query;

  if (!productId || !userId) {
    createErrorResponse(
      res,
      'INVALID_REQUEST',
      'productId and userId query parameters are required',
      400
    );
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
      loyaltyTier: user.loyaltyTier,
    });

    const preview = buildCheckoutPreview({
      product,
      user,
      pricing,
    });

    res.json(preview);
  } catch (error: any) {
    const mapped = mapCheckoutError(error);
    createErrorResponse(res, mapped.code, mapped.message, mapped.status);
  }
});

export default router;
