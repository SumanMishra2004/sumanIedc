import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────
// Response Types
// ─────────────────────────────────────────────────────────────

export type ApiSuccessResponse<T = any> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiErrorResponse = {
  success: false;
  error: string;
  details?: any;
};

export type ApiPaginatedResponse<T = any> = {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
};

// ─────────────────────────────────────────────────────────────
// Success Response Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Standard success response with data
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * Success response for creation (201)
 */
export function createdResponse<T>(
  data: T,
  message: string = "Resource created successfully"
): NextResponse<ApiSuccessResponse<T>> {
  return successResponse(data, message, 201);
}

/**
 * Success response for updates
 */
export function updatedResponse<T>(
  data: T,
  message: string = "Resource updated successfully"
): NextResponse<ApiSuccessResponse<T>> {
  return successResponse(data, message, 200);
}

/**
 * Success response for deletions
 */
export function deletedResponse(
  message: string = "Resource deleted successfully"
): NextResponse<ApiSuccessResponse<null>> {
  return successResponse(null, message, 200);
}

/**
 * Paginated response with metadata
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): NextResponse<ApiPaginatedResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    },
    { status: 200 }
  );
}

// ─────────────────────────────────────────────────────────────
// Error Response Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Standard error response
 */
export function errorResponse(
  error: string,
  status: number = 500,
  details?: any
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Bad request error (400)
 */
export function badRequestResponse(
  error: string = "Bad request",
  details?: any
): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 400, details);
}

/**
 * Unauthorized error (401)
 */
export function unauthorizedResponse(
  error: string = "Unauthorized — authentication required"
): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 401);
}

/**
 * Forbidden error (403)
 */
export function forbiddenResponse(
  error: string = "Forbidden — insufficient permissions"
): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 403);
}

/**
 * Not found error (404)
 */
export function notFoundResponse(
  resource: string = "Resource"
): NextResponse<ApiErrorResponse> {
  return errorResponse(`${resource} not found`, 404);
}

/**
 * Conflict error (409)
 */
export function conflictResponse(
  error: string = "Resource already exists"
): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 409);
}

/**
 * Validation error (422)
 */
export function validationErrorResponse(
  error: string = "Validation failed",
  details?: any
): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 422, details);
}

/**
 * Internal server error (500)
 */
export function serverErrorResponse(
  error: string = "Internal server error"
): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 500);
}

// ─────────────────────────────────────────────────────────────
// Pagination Helpers
// ─────────────────────────────────────────────────────────────

export type PaginationParams = {
  page: number;
  limit: number;
  skip: number;
};

/**
 * Parse and validate pagination parameters from URL
 */
export function getPaginationParams(
  searchParams: URLSearchParams,
  defaultLimit: number = 20,
  maxLimit: number = 100
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(searchParams.get("limit") || String(defaultLimit), 10))
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// ─────────────────────────────────────────────────────────────
// Filter Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Parse and validate status filter
 */
export function parseStatusFilter<T extends string>(
  searchParams: URLSearchParams,
  validStatuses: readonly T[]
): T | undefined {
  const status = searchParams.get("status");
  if (!status) return undefined;

  const upperStatus = status.toUpperCase();
  if (validStatuses.includes(upperStatus as T)) {
    return upperStatus as T;
  }

  return undefined;
}

/**
 * Parse search query for text fields
 */
export function parseSearchQuery(
  searchParams: URLSearchParams
): string | undefined {
  const search = searchParams.get("search")?.trim();
  return search || undefined;
}

/**
 * Parse boolean filter
 */
export function parseBooleanFilter(
  searchParams: URLSearchParams,
  key: string
): boolean | undefined {
  const value = searchParams.get(key);
  if (value === null) return undefined;
  return value === "true" || value === "1";
}

/**
 * Parse date range filters
 */
export function parseDateRange(
  searchParams: URLSearchParams
): { from?: Date; to?: Date } {
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  return {
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  };
}
