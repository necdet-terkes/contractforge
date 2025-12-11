// user-api/src/routes/users.ts

import { Request, Response, Router } from "express";
import { LoyaltyTier } from "../../../types/loyaltyTier";
import {
  listUsers,
  findUserById,
  createUser,
  updateUser,
  deleteUser
} from "../userRepository";
import { createErrorResponse } from "../../../types/utils/errors";
import { validateLoyaltyTier } from "../../../types/utils/validation";

const router = Router();

/**
 * @openapi
 * /users:
 *   get:
 *     summary: List all users
 *     description: Returns the current list of users from the in-memory repository.
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
 */
router.get("/users", async (_req: Request, res: Response) => {
  const users = await listUsers();
  res.json(users);
});

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get a single user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User identifier
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 loyaltyTier:
 *                   type: string
 *                   enum: [BRONZE, SILVER, GOLD]
 *       404:
 *         description: User not found
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
router.get("/users/:id", async (req: Request, res: Response) => {
  const user = await findUserById(req.params.id);

  if (!user) {
    createErrorResponse(
      res,
      "USER_NOT_FOUND",
      `User with id '${req.params.id}' not found`,
      404
    );
    return;
  }

  res.json(user);
});

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Create a new user
 *     description: >
 *       Creates a new user in the in-memory repository.
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
 *               - loyaltyTier
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               loyaltyTier:
 *                 type: string
 *                 enum: [BRONZE, SILVER, GOLD]
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 loyaltyTier:
 *                   type: string
 *                   enum: [BRONZE, SILVER, GOLD]
 *       400:
 *         description: Invalid payload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *       409:
 *         description: User with the same ID already exists
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
router.post("/users", async (req: Request, res: Response) => {
  const { id, name, loyaltyTier } = req.body ?? {};

  if (!id || !name || !loyaltyTier) {
    createErrorResponse(
      res,
      "INVALID_PAYLOAD",
      "id, name and loyaltyTier are required",
      400
    );
    return;
  }

  const tierValidation = validateLoyaltyTier(loyaltyTier);
  if (!tierValidation.valid) {
    createErrorResponse(
      res,
      tierValidation.error!.code,
      tierValidation.error!.message,
      400
    );
    return;
  }

  try {
    const user = await createUser({
      id: String(id),
      name: String(name),
      loyaltyTier: tierValidation.value!
    });

    res.status(201).json(user);
  } catch (error: any) {
    if (error.code === "USER_ALREADY_EXISTS") {
      createErrorResponse(res, "USER_ALREADY_EXISTS", error.message, 409);
      return;
    }

    console.error("Error while creating user:", error);
    createErrorResponse(
      res,
      "INTERNAL_ERROR",
      "Unexpected error while creating user",
      500
    );
  }
});

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     summary: Update an existing user
 *     description: >
 *       Updates the name and/or loyalty tier of an existing user.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               loyaltyTier:
 *                 type: string
 *                 enum: [BRONZE, SILVER, GOLD]
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 loyaltyTier:
 *                   type: string
 *                   enum: [BRONZE, SILVER, GOLD]
 *       400:
 *         description: Invalid payload
 *       404:
 *         description: User not found
 */
router.put("/users/:id", async (req: Request, res: Response) => {
  const { name, loyaltyTier } = req.body ?? {};

  if (name == null && loyaltyTier == null) {
    createErrorResponse(
      res,
      "INVALID_PAYLOAD",
      "At least one of name or loyaltyTier must be provided",
      400
    );
    return;
  }

  let normalizedTier: LoyaltyTier | undefined;

  if (loyaltyTier != null) {
    const tierValidation = validateLoyaltyTier(loyaltyTier);
    if (!tierValidation.valid) {
      createErrorResponse(
        res,
        tierValidation.error!.code,
        tierValidation.error!.message,
        400
      );
      return;
    }
    normalizedTier = tierValidation.value;
  }

  try {
    const updated = await updateUser(req.params.id, {
      name,
      loyaltyTier: normalizedTier
    });

    res.json(updated);
  } catch (error: any) {
    if (error.code === "USER_NOT_FOUND") {
      createErrorResponse(res, "USER_NOT_FOUND", error.message, 404);
      return;
    }

    console.error("Error while updating user:", error);
    createErrorResponse(
      res,
      "INTERNAL_ERROR",
      "Unexpected error while updating user",
      500
    );
  }
});

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: >
 *       Removes a user from the in-memory repository.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User identifier
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    await deleteUser(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === "USER_NOT_FOUND") {
      createErrorResponse(res, "USER_NOT_FOUND", error.message, 404);
      return;
    }

    console.error("Error while deleting user:", error);
    createErrorResponse(
      res,
      "INTERNAL_ERROR",
      "Unexpected error while deleting user",
      500
    );
  }
});

export default router;

