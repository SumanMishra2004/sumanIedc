import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { NextResponse } from "next/server";
import { errorResponse, validationErrorResponse } from "./response";

// ─────────────────────────────────────────────────────────────
// Error Handler
// ─────────────────────────────────────────────────────────────

/**
 * Centralized error handler for API routes.
 * Converts various error types into appropriate HTTP responses.
 */
export function handleApiError(error: unknown): NextResponse {
  console.error("API Error:", error);

  // Zod validation errors
  if (error instanceof ZodError) {
    const formattedErrors = error.issues.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));

    return validationErrorResponse("Validation failed", formattedErrors);
  }

  // Prisma known errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }

  // Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return validationErrorResponse("Database validation failed");
  }

  // Standard errors
  if (error instanceof Error) {
    return errorResponse(error.message);
  }

  // Unknown errors
  return errorResponse("An unexpected error occurred");
}

/**
 * Handle specific Prisma error codes
 */
function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError
): NextResponse {
  switch (error.code) {
    // Unique constraint violation
    case "P2002": {
      const target = (error.meta?.target as string[]) || [];
      const field = target[0] || "field";
      return errorResponse(
        `A record with this ${field} already exists`,
        409,
        { field, code: error.code }
      );
    }

    // Foreign key constraint violation
    case "P2003": {
      const field = (error.meta?.field_name as string) || "related record";
      return errorResponse(
        `Invalid reference: ${field} does not exist`,
        400,
        { field, code: error.code }
      );
    }

    // Record not found
    case "P2025":
      return errorResponse("Record not found", 404, { code: error.code });

    // Record to delete does not exist
    case "P2018":
      return errorResponse(
        "The record to delete does not exist",
        404,
        { code: error.code }
      );

    // Connected records exist (cannot delete due to foreign key)
    case "P2014":
      return errorResponse(
        "Cannot delete record: related records exist",
        400,
        { code: error.code }
      );

    // Query interpretation error
    case "P2019":
      return errorResponse(
        "Invalid query parameters",
        400,
        { code: error.code }
      );

    // Value out of range
    case "P2020":
      return errorResponse(
        "Value out of valid range",
        400,
        { code: error.code }
      );

    // Required field missing
    case "P2011":
      return errorResponse(
        "Required field is missing",
        400,
        { code: error.code }
      );

    // Invalid value for field type
    case "P2006":
      return errorResponse(
        "Invalid value provided",
        400,
        { code: error.code }
      );

    default:
      return errorResponse(
        "Database operation failed",
        500,
        { code: error.code }
      );
  }
}

// ─────────────────────────────────────────────────────────────
// Custom Error Classes
// ─────────────────────────────────────────────────────────────

export class UnauthorizedError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  constructor(message: string = "Validation failed", public details?: any) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ConflictError extends Error {
  constructor(message: string = "Resource conflict") {
    super(message);
    this.name = "ConflictError";
  }
}

/**
 * Try-catch wrapper that automatically handles errors
 */
export async function tryCatch<T>(
  fn: () => Promise<T>
): Promise<T | NextResponse> {
  try {
    return await fn();
  } catch (error) {
    return handleApiError(error);
  }
}
