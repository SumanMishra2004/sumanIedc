import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  profileCompleted: boolean;
};

export type ApiContext = {
  user: AuthenticatedUser;
  req: NextRequest;
};

export type ApiHandler<T = any> = (
  context: ApiContext
) => Promise<NextResponse<T>>;

// ─────────────────────────────────────────────────────────────
// Authentication Middleware
// ─────────────────────────────────────────────────────────────

/**
 * Authenticates the request and ensures user is logged in.
 * Returns 401 if not authenticated.
 */
export async function requireAuth(
  req: NextRequest
): Promise<{ user: AuthenticatedUser } | NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized — authentication required" },
      { status: 401 }
    );
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role as UserRole,
      name: session.user.name,
      profileCompleted: session.user.profileCompleted,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Role-Based Authorization Middleware
// ─────────────────────────────────────────────────────────────

/**
 * Role hierarchy for authorization checks.
 * Higher index = more permissions.
 */
const ROLE_HIERARCHY: UserRole[] = [
  "STUDENT",
  "FACULTY",
  "EDITOR",
  "ADMIN",
  "SUPERADMIN",
];

/**
 * Check if user has required role or higher in hierarchy.
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole);
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);
  return userIndex >= requiredIndex;
}

/**
 * Ensures user has the minimum required role.
 * Returns 403 if unauthorized.
 */
export function requireRole(
  user: AuthenticatedUser,
  minimumRole: UserRole
): NextResponse | null {
  if (!hasRole(user.role, minimumRole)) {
    return NextResponse.json(
      {
        success: false,
        error: `Forbidden — requires ${minimumRole} role or higher`,
      },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Ensures user has one of the specified roles (exact match).
 */
export function requireExactRole(
  user: AuthenticatedUser,
  allowedRoles: UserRole[]
): NextResponse | null {
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      {
        success: false,
        error: `Forbidden — requires one of: ${allowedRoles.join(", ")}`,
      },
      { status: 403 }
    );
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// API Handler Wrapper
// ─────────────────────────────────────────────────────────────

/**
 * Wraps an API handler with authentication.
 * Automatically handles auth and provides user context.
 */
export function withAuth(handler: ApiHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const authResult = await requireAuth(req);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    try {
      return await handler({ user: authResult.user, req });
    } catch (error) {
      console.error("API Handler Error:", error);
      return NextResponse.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Internal server error",
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Wraps an API handler with authentication and role requirement.
 */
export function withRole(minimumRole: UserRole, handler: ApiHandler) {
  return withAuth(async (context) => {
    const roleCheck = requireRole(context.user, minimumRole);
    if (roleCheck) return roleCheck;

    return handler(context);
  });
}

/**
 * Wraps an API handler with authentication and exact role requirement.
 */
export function withExactRole(allowedRoles: UserRole[], handler: ApiHandler) {
  return withAuth(async (context) => {
    const roleCheck = requireExactRole(context.user, allowedRoles);
    if (roleCheck) return roleCheck;

    return handler(context);
  });
}

// ─────────────────────────────────────────────────────────────
// Authorization Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Check if user can modify a resource owned by another user.
 * Students/Faculty can only modify their own resources.
 * Editors and above can modify any resource.
 */
export function canModifyResource(
  user: AuthenticatedUser,
  resourceOwnerId: string
): boolean {
  // Own resource
  if (user.id === resourceOwnerId) return true;

  // Editor and above can modify any resource
  return hasRole(user.role, "EDITOR");
}

/**
 * Check if user can delete a resource.
 * Only ADMIN and SUPERADMIN can delete.
 */
export function canDeleteResource(user: AuthenticatedUser): boolean {
  return hasRole(user.role, "ADMIN");
}

/**
 * Check if user can change research status.
 * Only EDITOR and above can change status.
 */
export function canChangeStatus(user: AuthenticatedUser): boolean {
  return hasRole(user.role, "EDITOR");
}

/**
 * Check if user can view all submissions.
 * EDITOR and above can view all, others only their own.
 */
export function canViewAllSubmissions(user: AuthenticatedUser): boolean {
  return hasRole(user.role, "EDITOR");
}

/**
 * Check if user can manage other users.
 * Only ADMIN and above.
 */
export function canManageUsers(user: AuthenticatedUser): boolean {
  return hasRole(user.role, "ADMIN");
}

/**
 * Check if user can change user roles.
 * Only SUPERADMIN.
 */
export function canChangeUserRole(user: AuthenticatedUser): boolean {
  return user.role === "SUPERADMIN";
}
