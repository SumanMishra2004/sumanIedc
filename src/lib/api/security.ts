/**
 * @file security.ts
 * @description Security utilities for API routes to prevent common vulnerabilities
 * 
 * Key features:
 * - Race condition prevention (TOCTOU fixes)
 * - IDOR protection
 * - Safe resource operations
 * - Ownership verification
 */

import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { notFoundResponse, forbiddenResponse } from './response';
import type { AuthenticatedUser } from './middleware';

// ─────────────────────────────────────────────────────────────
// Safe Resource Operations (Race Condition Prevention)
// ─────────────────────────────────────────────────────────────

/**
 * Safely update a resource without race conditions.
 * 
 * Instead of check-then-act pattern (vulnerable to TOCTOU):
 *   const exists = await prisma.model.findUnique({ where: { id } })
 *   if (!exists) return notFound()
 *   await prisma.model.update({ where: { id }, data })
 * 
 * Use this single atomic operation that handles non-existent records:
 *   const result = await safeUpdate(prisma.model, id, data)
 *   if (!result.success) return result.response
 */
export async function safeUpdate<T extends { id: string }>(
  model: any,
  id: string,
  data: any,
  resourceName: string = 'Resource'
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const updated = await model.update({
      where: { id },
      data,
    }) as T;
    
    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        // Record not found
        return { success: false, response: notFoundResponse(resourceName) };
      }
    }
    throw error; // Re-throw other errors to be handled by error handler
  }
}

/**
 * Safely delete a resource without race conditions.
 */
export async function safeDelete(
  model: any,
  id: string,
  resourceName: string = 'Resource'
): Promise<{ success: true } | { success: false; response: NextResponse }> {
  try {
    await model.delete({
      where: { id },
    });
    
    return { success: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        // Record not found
        return { success: false, response: notFoundResponse(resourceName) };
      }
      if (error.code === 'P2014' || error.code === 'P2003') {
        // Foreign key constraint failed
        return { 
          success: false, 
          response: NextResponse.json(
            { 
              success: false, 
              error: `Cannot delete ${resourceName.toLowerCase()}: related records exist` 
            },
            { status: 400 }
          )
        };
      }
    }
    throw error;
  }
}

/**
 * Safely fetch and verify a resource with ownership check.
 * Prevents IDOR vulnerabilities by checking authorization BEFORE returning data.
 *
 * Returns 404 for both "not found" and "not authorized" to avoid leaking existence.
 */
export async function safeFetchWithOwnership<T extends Record<string, unknown>>(
  model: any,
  id: string,
  user: AuthenticatedUser,
  options: {
    resourceName?: string;
    include?: any;
    ownershipCheck: (resource: T, user: AuthenticatedUser) => boolean;
    bypassRoles?: string[];
  }
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  const { resourceName = 'Resource', include, ownershipCheck, bypassRoles = ['EDITOR', 'ADMIN', 'SUPERADMIN'] } = options;

  try {
    const resource = await model.findUnique({
      where: { id },
      ...(include && { include }),
    }) as T | null;

    if (!resource) {
      return { success: false, response: notFoundResponse(resourceName) };
    }

    // Bypass ownership for privileged roles
    if (bypassRoles.includes(user.role)) {
      return { success: true, data: resource };
    }

    // Check ownership — return 404 (not 403) to hide existence from unauthorized callers
    if (!ownershipCheck(resource, user)) {
      return { success: false, response: notFoundResponse(resourceName) };
    }

    return { success: true, data: resource };
  } catch (error) {
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// Ownership Verification Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Check if user owns a simple resource (has userId field)
 */
export function isResourceOwner<T extends { userId?: string | null }>(
  resource: T,
  userId: string
): boolean {
  return resource.userId === userId;
}

/**
 * Check if user is a student author on a research record
 */
export function isStudentAuthorOf(
  resource: { studentAuthors: Array<{ userId: string }> },
  userId: string
): boolean {
  return resource.studentAuthors.some((author) => author.userId === userId);
}

/**
 * Check if user is a faculty author on a research record
 */
export function isFacultyAuthorOf(
  resource: { facultyAuthors: Array<{ userId: string | null }> },
  userId: string
): boolean {
  return resource.facultyAuthors.some((author) => author.userId === userId);
}

/**
 * Check if user is any type of author on a research record
 */
export function isAuthorOf(
  resource: {
    studentAuthors?: Array<{ userId: string }>;
    facultyAuthors?: Array<{ userId: string | null }>;
  },
  userId: string
): boolean {
  const isStudent = resource.studentAuthors ? isStudentAuthorOf({ studentAuthors: resource.studentAuthors }, userId) : false;
  const isFaculty = resource.facultyAuthors ? isFacultyAuthorOf({ facultyAuthors: resource.facultyAuthors }, userId) : false;
  return isStudent || isFaculty;
}

// ─────────────────────────────────────────────────────────────
// Status Lock Verification
// ─────────────────────────────────────────────────────────────

/**
 * Check if a resource is locked for editing based on status
 */
export function isLockedForStudent(
  teacherStatus?: string | null,
  isPublished?: boolean
): boolean {
  if (isPublished) return true;
  
  const lockedStatuses = ['VERIFIED', 'PUBLISHED', 'ACCEPTED'];
  return teacherStatus ? lockedStatuses.includes(teacherStatus) : false;
}

/**
 * Check if a resource can be deleted based on status
 */
export function canDeleteResource(
  status?: string | null,
  allowedStatuses: string[] = ['SUBMITTED', 'DRAFT']
): boolean {
  if (!status) return true;
  return allowedStatuses.includes(status);
}

// ─────────────────────────────────────────────────────────────
// Transaction Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Execute multiple operations in a transaction
 */
export async function executeTransaction<T>(
  operations: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    return await operations(tx);
  });
}

/**
 * Execute with retry logic (for handling transient failures)
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 100
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const nonRetryableCodes = ['P2002', 'P2025', 'P2003', 'P2014'];
        if (nonRetryableCodes.includes(error.code)) {
          throw error;
        }
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError;
}

// ─────────────────────────────────────────────────────────────
// Unique Constraint Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Check if a unique field value is available (not already taken)
 * Returns true if available, false if taken
 */
export async function isUniqueFieldAvailable(
  model: any,
  field: string,
  value: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await model.findFirst({
    where: {
      [field]: value,
      ...(excludeId && { id: { not: excludeId } }),
    },
  });
  
  return !existing;
}

/**
 * Validate unique field before update
 */
export async function validateUniqueField(
  model: any,
  field: string,
  value: string,
  currentValue: string,
  excludeId?: string,
  fieldDisplayName?: string
): Promise<NextResponse | null> {
  // If value hasn't changed, no need to check
  if (value === currentValue) {
    return null;
  }
  
  const available = await isUniqueFieldAvailable(model, field, value, excludeId);
  
  if (!available) {
    return NextResponse.json(
      {
        success: false,
        error: `A record with this ${fieldDisplayName || field} already exists`,
      },
      { status: 409 }
    );
  }
  
  return null;
}

// ─────────────────────────────────────────────────────────────
// Cascade Delete Protection
// ─────────────────────────────────────────────────────────────

/**
 * Check if a resource has dependent records before deletion
 */
export async function checkDependencies(
  checks: Array<{
    model: any;
    where: any;
    description: string;
  }>
): Promise<{ canDelete: true } | { canDelete: false; response: NextResponse }> {
  const dependencies: string[] = [];
  
  for (const check of checks) {
    const count = await check.model.count({ where: check.where });
    if (count > 0) {
      dependencies.push(`${count} ${check.description}`);
    }
  }
  
  if (dependencies.length > 0) {
    return {
      canDelete: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Cannot delete resource: dependent records exist',
          details: { dependencies },
        },
        { status: 400 }
      ),
    };
  }
  
  return { canDelete: true };
}
