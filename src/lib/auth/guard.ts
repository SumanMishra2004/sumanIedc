/**
 * @file guard.ts
 * @description Server-side authentication and authorization guard helpers.
 *
 * Every protected API route and server action MUST call one of these guards
 * before touching any data. They return typed result objects so callers get
 * both the session and a properly typed error response when unauthorized.
 *
 * Usage pattern:
 *   const guard = await requireAuth(request)
 *   if (!guard.ok) return guard.response
 *   const { session } = guard
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import {
  hasMinimumRole,
  isAdminOrHigher,
  isSuperAdmin,
  type UserRoleString,
} from '@/lib/auth/permissions'

// ─── Result types ─────────────────────────────────────────────────────────────

export type AuthSession = {
  user: {
    id: string
    email: string
    name: string
    image: string
    role: string
    profileCompleted: boolean
  }
}

export type GuardOk = { ok: true; session: AuthSession }
export type GuardFail = { ok: false; response: NextResponse }
export type GuardResult = GuardOk | GuardFail

// ─── Core guard ───────────────────────────────────────────────────────────────

/**
 * Verifies the user is authenticated.
 * Returns 401 if unauthenticated.
 */
export async function requireAuth(_req?: NextRequest): Promise<GuardResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Unauthorized — authentication required' },
        { status: 401 },
      ),
    }
  }

  return { ok: true, session: session as AuthSession }
}

/**
 * Verifies the user is authenticated AND has at least the given minimum role.
 * Returns 401 if unauthenticated, 403 if authenticated but insufficient role.
 */
export async function requireRole(
  minimumRole: UserRoleString,
  _req?: NextRequest,
): Promise<GuardResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Unauthorized — authentication required' },
        { status: 401 },
      ),
    }
  }

  if (!hasMinimumRole(session.user.role, minimumRole)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Forbidden — ${minimumRole} or higher required` },
        { status: 403 },
      ),
    }
  }

  return { ok: true, session: session as AuthSession }
}

/**
 * Verifies the user is authenticated AND has one of the specified roles.
 * Returns 401 if unauthenticated, 403 if authenticated but role not in list.
 */
export async function requireAnyRole(
  allowedRoles: UserRoleString[],
  _req?: NextRequest,
): Promise<GuardResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Unauthorized — authentication required' },
        { status: 401 },
      ),
    }
  }

  if (!allowedRoles.includes(session.user.role as UserRoleString)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Forbidden — required role: ${allowedRoles.join(' or ')}` },
        { status: 403 },
      ),
    }
  }

  return { ok: true, session: session as AuthSession }
}

/**
 * Requires ADMIN or higher. Returns 401/403 appropriately.
 */
export async function requireAdmin(_req?: NextRequest): Promise<GuardResult> {
  return requireRole('ADMIN', _req)
}

/**
 * Requires SUPERADMIN. Returns 401/403 appropriately.
 */
export async function requireSuperAdmin(_req?: NextRequest): Promise<GuardResult> {
  return requireRole('SUPERADMIN', _req)
}

/**
 * Requires EDITOR or higher. Returns 401/403 appropriately.
 */
export async function requireEditor(_req?: NextRequest): Promise<GuardResult> {
  return requireRole('EDITOR', _req)
}

// ─── Resource ownership guards ────────────────────────────────────────────────

/**
 * Returns true when the session user owns the resource (userId matches) OR
 * has a role that can bypass ownership checks (EDITOR+).
 *
 * Always call this AFTER fetching the resource from the DB.
 * Pass the resource's userId field and the session user id.
 *
 * @param sessionUserId  - session.user.id (from server session, never client)
 * @param sessionRole    - session.user.role (from server session, never client)
 * @param resourceUserId - The userId stored on the resource record
 * @param bypassRole     - Minimum role that bypasses the ownership check (default EDITOR)
 */
export function ownsResourceOrHasRole(
  sessionUserId: string,
  sessionRole: string,
  resourceUserId: string,
  bypassRole: UserRoleString = 'EDITOR',
): boolean {
  if (sessionUserId === resourceUserId) return true
  return hasMinimumRole(sessionRole, bypassRole)
}

/**
 * Returns 403/404 response when a user tries to access a resource they
 * don't own and don't have elevated permissions for.
 *
 * Uses 404 to avoid leaking resource existence to unauthorized users.
 *
 * @param expose404 - When true, respond with 403 (existence is already known).
 *                   When false (default), respond with 404 to hide existence.
 */
export function forbiddenOrNotFound(
  expose404 = false,
): NextResponse {
  if (expose404) {
    return NextResponse.json(
      { error: 'Forbidden — you do not have access to this resource' },
      { status: 403 },
    )
  }
  return NextResponse.json(
    { error: 'Not found' },
    { status: 404 },
  )
}

// ─── Research authorship guards ───────────────────────────────────────────────

/**
 * Checks whether the session user is a student author on a research record.
 * The `studentAuthors` must be included in the Prisma query before calling.
 */
export function isStudentAuthor(
  userId: string,
  studentAuthors: Array<{ userId: string }>,
): boolean {
  return studentAuthors.some((sa) => sa.userId === userId)
}

/**
 * Checks whether the session user is a faculty author on a research record.
 * The `facultyAuthors` must be included in the Prisma query before calling.
 */
export function isFacultyAuthor(
  userId: string,
  facultyAuthors: Array<{ userId: string | null }>,
): boolean {
  return facultyAuthors.some((fa) => fa.userId === userId)
}

/**
 * Unified research record access check.
 *
 * Returns true when the user may access (read/write) the research record:
 *  - EDITOR/ADMIN/SUPERADMIN always have access
 *  - STUDENT has access if they are in studentAuthors
 *  - FACULTY has access if they are in facultyAuthors
 */
export function canAccessResearchRecord(
  sessionUserId: string,
  sessionRole: string,
  studentAuthors: Array<{ userId: string }>,
  facultyAuthors: Array<{ userId: string | null }>,
): boolean {
  if (hasMinimumRole(sessionRole, 'EDITOR')) return true
  if (sessionRole === 'STUDENT') return isStudentAuthor(sessionUserId, studentAuthors)
  if (sessionRole === 'FACULTY') return isFacultyAuthor(sessionUserId, facultyAuthors)
  return false
}

// ─── IP extraction helper ─────────────────────────────────────────────────────

/**
 * Extracts the best-effort client IP from request headers.
 * Used for audit logging — NOT for security decisions.
 */
export async function getClientIp(req?: NextRequest): Promise<string> {
  try {
    if (req) {
      return (
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        req.headers.get('x-real-ip') ??
        'unknown'
      )
    }
    const hdrs = await headers()
    return (
      hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      hdrs.get('x-real-ip') ??
      'unknown'
    )
  } catch {
    return 'unknown'
  }
}
