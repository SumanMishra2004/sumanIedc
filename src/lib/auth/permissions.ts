/**
 * Centralized authorization library.
 *
 * Every role-based decision in the application should flow through these
 * helpers so there is a single source of truth for the role hierarchy and
 * permission matrix.
 *
 * Security principle:
 *   - All helpers operate on plain strings (matching session.user.role) so
 *     they work identically on the server (API routes, server actions) and
 *     the client (React components).
 *   - Never trust a role that came only from client state — always re-derive
 *     it from the server session for sensitive operations.
 */

// ─── Role hierarchy ──────────────────────────────────────────────────────────
// Higher number = more authority.
export const ROLE_HIERARCHY: Record<string, number> = {
  STUDENT: 0,
  FACULTY: 1,
  EDITOR: 2,
  ADMIN: 3,
  SUPERADMIN: 4,
}

/** All valid role strings in the system */
export const ALL_ROLES = Object.keys(ROLE_HIERARCHY) as UserRoleString[]

export type UserRoleString = 'STUDENT' | 'FACULTY' | 'EDITOR' | 'ADMIN' | 'SUPERADMIN'

// ─── Basic role predicates ───────────────────────────────────────────────────

/** Returns the numeric rank for a role string (0 = STUDENT, 4 = SUPERADMIN) */
export function roleRank(role: string): number {
  return ROLE_HIERARCHY[role] ?? -1
}

/** True when the user's role is exactly the given role */
export function hasRole(userRole: string, role: UserRoleString): boolean {
  return userRole === role
}

/**
 * True when the user's role is at least as powerful as the given minimum.
 * This is the primary guard used throughout the application.
 */
export function hasMinimumRole(userRole: string, minimum: UserRoleString): boolean {
  return roleRank(userRole) >= roleRank(minimum)
}

// ─── Convenience predicates ──────────────────────────────────────────────────

export function isStudent(role: string): boolean {
  return role === 'STUDENT'
}

export function isFaculty(role: string): boolean {
  return role === 'FACULTY'
}

export function isEditor(role: string): boolean {
  return role === 'EDITOR'
}

export function isAdmin(role: string): boolean {
  return role === 'ADMIN'
}

export function isSuperAdmin(role: string): boolean {
  return role === 'SUPERADMIN'
}

/** Faculty OR higher (can act as a faculty co-author, run reviews, etc.) */
export function isFacultyOrHigher(role: string): boolean {
  return hasMinimumRole(role, 'FACULTY')
}

/** Editor OR higher (can approve/reject submissions) */
export function isEditorOrHigher(role: string): boolean {
  return hasMinimumRole(role, 'EDITOR')
}

/** Admin OR higher (can manage users and platform config) */
export function isAdminOrHigher(role: string): boolean {
  return hasMinimumRole(role, 'ADMIN')
}

/**
 * True when the role is one that can be listed as a faculty co-author on
 * research submissions.  Faculty, Editor, Admin, and SuperAdmin all count;
 * students do not.
 */
export function isFacultyAuthorRole(role: string): boolean {
  return isFacultyOrHigher(role)
}

// ─── User management permission matrix ──────────────────────────────────────

/**
 * Can `actorRole` modify or delete the account whose role is `targetRole`?
 *
 * Rules:
 *  - Users can never manage themselves (caller must add that check separately).
 *  - ADMIN can manage STUDENT, FACULTY, EDITOR, ADMIN — not SUPERADMIN.
 *  - SUPERADMIN can manage anyone.
 *  - Everyone else: no.
 */
export function canManageUser(actorRole: string, targetRole: string): boolean {
  if (!isAdminOrHigher(actorRole)) return false
  if (isSuperAdmin(actorRole)) return true // SUPERADMIN can manage anyone
  // ADMIN: cannot manage SUPERADMIN
  if (isSuperAdmin(targetRole)) return false
  return true
}

/**
 * Can `actorRole` assign `targetRole` to another user?
 *
 * Role assignment matrix (also enforced server-side):
 *
 *   ADMIN     → STUDENT, FACULTY, EDITOR, ADMIN  (cannot assign SUPERADMIN)
 *   SUPERADMIN → all five roles
 *   everyone else → nobody
 *
 * Additionally, users must NEVER be able to change their own role — the
 * caller is responsible for that check (compare userId with targetUserId).
 */
export function canAssignRole(actorRole: string, targetRole: UserRoleString): boolean {
  if (!isAdminOrHigher(actorRole)) return false
  if (isSuperAdmin(actorRole)) return true // SUPERADMIN can assign any role
  // ADMIN cannot assign SUPERADMIN
  if (targetRole === 'SUPERADMIN') return false
  return true
}

// ─── Content permission helpers ──────────────────────────────────────────────

/** Can the user edit their own research records? (any authenticated user can) */
export function canEditOwnContent(_role: string): boolean {
  return true
}

/**
 * Can the user approve / reject research submissions (TeacherStatus changes)?
 * Faculty and higher.
 */
export function canApproveContent(role: string): boolean {
  return isFacultyOrHigher(role)
}

/**
 * Can the user publish content (set isPublic = true / journalStatus = PUBLISHED)?
 * Only Admin and higher.
 */
export function canPublishContent(role: string): boolean {
  return isAdminOrHigher(role)
}

// ─── Faculty verification permission helpers ─────────────────────────────────

/** Students can CREATE a faculty co-author verification request. */
export function canCreateVerificationRequest(role: string): boolean {
  return role === 'STUDENT'
}

/**
 * A faculty member (or higher) who was specifically named in a request can
 * ACCEPT or REJECT it.  Admins can view all requests and perform overrides;
 * they cannot accept on behalf of the named faculty via the normal flow.
 */
export function canVerifyRequest(role: string): boolean {
  return isFacultyOrHigher(role)
}

/** Admin and SuperAdmin can view all verification records and perform overrides */
export function canAdminOverrideVerification(role: string): boolean {
  return isAdminOrHigher(role)
}

// ─── Research visibility ─────────────────────────────────────────────────────

/**
 * Does this role see ALL research records (i.e., bypass the
 * isPublic / author-membership filter)?
 */
export function canViewAllResearch(role: string): boolean {
  return isEditorOrHigher(role)
}

// ─── Sidebar / navigation helpers ────────────────────────────────────────────

export function showAdminNav(role: string): boolean {
  return isAdminOrHigher(role)
}

export function showEditorNav(role: string): boolean {
  return isEditorOrHigher(role)
}

export function showFacultyNav(role: string): boolean {
  return isFacultyOrHigher(role)
}
