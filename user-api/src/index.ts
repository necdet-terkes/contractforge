import express, { Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import { getUserById, users } from "./users";

const app = express();
const PORT = process.env.PORT || 4002;

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
app.get("/users", (_req: Request, res: Response) => {
  res.json(users);
});

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get a user by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User identifier
 *     responses:
 *       200:
 *         description: User details
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
app.get("/users/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const user = getUserById(id);

  if (!user) {
    res.status(404).json({
      error: "USER_NOT_FOUND",
      message: `User with id '${id}' was not found`
    });
    return;
  }

  res.json(user);
});

app.listen(PORT, () => {
  console.log(`User API listening on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/docs`);
});