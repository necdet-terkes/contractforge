// Shared error response utility used across all services

import { Response } from "express";

export function createErrorResponse(
  res: Response,
  code: string,
  message: string,
  statusCode: number
): void {
  res.status(statusCode).json({
    error: code,
    message
  });
}
