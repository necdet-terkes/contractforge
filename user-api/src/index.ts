// user-api/src/index.ts

import express, { Request, Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import { LoyaltyTier } from "./users";
import {
  listUsers,
  findUserById,
  createUser,
  updateUser,
  deleteUser
} from "./userRepository";

const app = express();
const PORT = process.env.PORT || 4002;

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
 *     summary: Health check for the user service
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
  res.json({ status: "ok", service: "user-api" });
});

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
app.get("/users", async (_req: Request, res: Response) => {
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
app.get("/users/:id", async (req: Request, res: Response) => {
  const user = await findUserById(req.params.id);

  if (!user) {
    res.status(404).json({
      error: "USER_NOT_FOUND",
      message: `User with id '${req.params.id}' not found`
    });
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
app.post("/users", async (req: Request, res: Response) => {
  const { id, name, loyaltyTier } = req.body ?? {};

  if (!id || !name || !loyaltyTier) {
    res.status(400).json({
      error: "INVALID_PAYLOAD",
      message: "id, name and loyaltyTier are required"
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

  try {
    const user = await createUser({
      id: String(id),
      name: String(name),
      loyaltyTier: normalizedTier
    });

    res.status(201).json(user);
  } catch (error: any) {
    if (error.code === "USER_ALREADY_EXISTS") {
      res.status(409).json({
        error: "USER_ALREADY_EXISTS",
        message: error.message
      });
      return;
    }

    console.error("Error while creating user:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Unexpected error while creating user"
    });
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
app.put("/users/:id", async (req: Request, res: Response) => {
  const { name, loyaltyTier } = req.body ?? {};

  if (name == null && loyaltyTier == null) {
    res.status(400).json({
      error: "INVALID_PAYLOAD",
      message: "At least one of name or loyaltyTier must be provided"
    });
    return;
  }

  let normalizedTier: LoyaltyTier | undefined;

  if (loyaltyTier != null) {
    const candidate = String(loyaltyTier).toUpperCase();
    if (!["BRONZE", "SILVER", "GOLD"].includes(candidate)) {
      res.status(400).json({
        error: "INVALID_TIER",
        message: "loyaltyTier must be one of BRONZE, SILVER or GOLD"
      });
      return;
    }
    normalizedTier = candidate as LoyaltyTier;
  }

  try {
    const updated = await updateUser(req.params.id, {
      name,
      loyaltyTier: normalizedTier
    });

    res.json(updated);
  } catch (error: any) {
    if (error.code === "USER_NOT_FOUND") {
      res.status(404).json({
        error: "USER_NOT_FOUND",
        message: error.message
      });
      return;
    }

    console.error("Error while updating user:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Unexpected error while updating user"
    });
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
app.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    await deleteUser(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === "USER_NOT_FOUND") {
      res.status(404).json({
        error: "USER_NOT_FOUND",
        message: error.message
      });
      return;
    }

    console.error("Error while deleting user:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Unexpected error while deleting user"
    });
  }
});

app.listen(PORT, () => {
  console.log(`User API listening on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/docs`);
});
