/**
 * @file permissions.ts
 * @description Centralized authorization library — single source of truth for every
 * role-based decision in the platform.
 *
 * SECURITY CONTRACT:
 *  - All helpers operate on plain strings (matching session.user.role).
 *  - They work identically on server (API routes, server actions) and client
 *    (React components for UI hints ONLY — never for real security decisions).
 *  - Server-side authorization is MANDATORY. Frontend role checks are UX only.
 *  - Never trust a role value that came from the client request body or URL.
 *  - Always derive userId and role from the authenticated session.
 */

// ─── Role hierarchy ──────────────────────────────────────────────────────────
// Higher number = more institutional authority.
// A higher rank does NOT automatically inherit all lower-rank permissions —
// permissions are explicitly defined below.
export const ROLE_HIERARCHY: Record<string, number> = {
  STUDENT:    0,
  FACULTY:    1,
  EDITOR:     2,
  ADMIN:      3,
  SUPERADMIN: 4,
}

export type UserRoleString = 'STUDENT' | 'FACULTY' | 'EDITOR' | 'ADMIN' | 'SUPERADMIN'

/** All valid role strings in the system */
export const ALL_ROLES = Object.keys(ROLE_HIERARCHY) as UserRoleString[]

// ─── Role rank utilities ─────────────────────────────────────────────────────

/** Numeric rank for a role string (−1 when unknown) */
export function roleRank(role: string): number {
  return ROLE_HIERARCHY[role] ?? -1
}

/** Exact role match */
export function hasRole(userRole: string, role: UserRoleString): boolean {
  return userRole === role
}

/**
 * True when the user's role is at least as powerful as the given minimum.
 * Primary guard used throughout the application.
 */
export function hasMinimumRole(userRole: string, minimum: UserRoleString): boolean {
  return roleRank(userRole) >= roleRank(minimum)
}

// ─── Convenience role predicates ─────────────────────────────────────────────

export function isStudent(role: string): boolean    { return role === 'STUDENT' }
export function isFaculty(role: string): boolean    { return role === 'FACULTY' }
export function isEditor(role: string): boolean     { return role === 'EDITOR' }
export function isAdmin(role: string): boolean      { return role === 'ADMIN' }
export function isSuperAdmin(role: string): boolean { return role === 'SUPERADMIN' }

/** FACULTY or higher — can be listed as a faculty co-author */
export function isFacultyOrHigher(role: string): boolean {
  return hasMinimumRole(role, 'FACULTY')
}

/** EDITOR or higher — primary editorial/content role */
export function isEditorOrHigher(role: string): boolean {
  return hasMinimumRole(role, 'EDITOR')
}

/** ADMIN or higher — institutional administration */
export function isAdminOrHigher(role: string): boolean {
  return hasMinimumRole(role, 'ADMIN')
}

/** True when role can be listed as a faculty co-author on research */
export function isFacultyAuthorRole(role: string): boolean {
  return isFacultyOrHigher(role)
}

// ─── Research permissions ────────────────────────────────────────────────────

/**
 * Can the role SEE all research records (bypass isPublic / author filter)?
 * EDITOR, ADMIN, SUPERADMIN — yes.
 */
export function canViewAllResearch(role: string): boolean {
  return isEditorOrHigher(role)
}

/**
 * Can the role REVIEW research (move to UNDER_REVIEW, request updates,
 * APPROVE, REJECT) via the TeacherStatus / editorial workflow?
 *
 * FACULTY can review research they are an author on.
 * EDITOR can review any research.
 * ADMIN / SUPERADMIN can review any research.
 */
export function canReviewResearch(role: string): boolean {
  return isFacultyOrHigher(role)
}

/**
 * Can the role PUBLISH research (set isPublic=true / terminal published status)?
 *
 * EDITOR, ADMIN, SUPERADMIN — yes.
 * FACULTY and STUDENT — NO. They can approve/accept but cannot publish.
 *
 * NOTE: This fixes the existing bug where canPublishContent was restricted to
 * ADMIN+. Per the spec, EDITOR is the primary publication authority.
 */
export function canPublishContent(role: string): boolean {
  return isEditorOrHigher(role)
}

/**
 * Can the role approve/reject research submissions for editorial purposes?
 * EDITOR+.
 */
export function canEditorialApprove(role: string): boolean {
  return isEditorOrHigher(role)
}

// ─── Achievement permissions ─────────────────────────────────────────────────

/** STUDENT and FACULTY can submit their own achievements */
export function canSubmitAchievement(role: string): boolean {
  return role === 'STUDENT' || role === 'FACULTY'
}

/**
 * EDITOR can review, approve, reject, and manage achievement visibility.
 * ADMIN and SUPERADMIN also have full achievement management.
 */
export function canReviewAchievement(role: string): boolean {
  return isEditorOrHigher(role)
}

/** Only EDITOR+ can approve achievements (set achievementStatus = APPROVED) */
export function canApproveAchievement(role: string): boolean {
  return isEditorOrHigher(role)
}

// ─── Event permissions ───────────────────────────────────────────────────────

/**
 * EDITOR is the primary event manager.
 * ADMIN and SUPERADMIN also have full event management.
 * STUDENT and FACULTY cannot create or manage official platform events.
 */
export function canManageEvents(role: string): boolean {
  return isEditorOrHigher(role)
}

export function canCreateEvent(role: string): boolean {
  return isEditorOrHigher(role)
}

export function canPublishEvent(role: string): boolean {
  return isEditorOrHigher(role)
}

export function canCancelEvent(role: string): boolean {
  return isEditorOrHigher(role)
}

export function canArchiveEvent(role: string): boolean {
  return isEditorOrHigher(role)
}

// ─── Grant permissions ───────────────────────────────────────────────────────

/**
 * FACULTY, ADMIN, SUPERADMIN can create grants.
 * STUDENT cannot initiate a grant.
 * EDITOR cannot create grants (editorial role, not a research PI).
 */
export function canCreateGrant(role: string): boolean {
  return role === 'FACULTY' || isAdminOrHigher(role)
}

/**
 * Only ADMIN and SUPERADMIN can officially approve / reject / complete grants.
 * FACULTY PI can manage their own grant team and bills but cannot self-approve.
 */
export function canApproveGrant(role: string): boolean {
  return isAdminOrHigher(role)
}

/** Only ADMIN and SUPERADMIN can mark grants COMPLETED */
export function canCompleteGrant(role: string): boolean {
  return isAdminOrHigher(role)
}

/**
 * ADMIN and SUPERADMIN have full grant financial management.
 * FACULTY PI can view and approve bills in their own grants.
 */
export function canManageGrantFinancials(role: string): boolean {
  return isAdminOrHigher(role)
}

// ─── Bill permissions ────────────────────────────────────────────────────────

/**
 * Grant participants (STUDENT, FACULTY, EDITOR who are members) can submit
 * bills. This is the role-level check; the route must also verify membership.
 */
export function canSubmitBill(role: string): boolean {
  return role !== 'SUPERADMIN' // everyone except pure admin-level can submit
  // Additional membership check is done at the resource level
}

/** Only ADMIN+ can mark a bill PAID (financial disbursement) */
export function canPayBill(role: string): boolean {
  return isAdminOrHigher(role)
}

// ─── Faculty verification permissions ────────────────────────────────────────

/** Only STUDENTS create verification requests through the research workflow */
export function canCreateVerificationRequest(role: string): boolean {
  return role === 'STUDENT'
}

/** Faculty and higher can accept/reject a request directed at them */
export function canVerifyRequest(role: string): boolean {
  return isFacultyOrHigher(role)
}

/** ADMIN and SUPERADMIN can perform administrative overrides on verifications */
export function canAdminOverrideVerification(role: string): boolean {
  return isAdminOrHigher(role)
}

// ─── User management permissions ────────────────────────────────────────────

/**
 * Can `actorRole` modify or delete the account whose role is `targetRole`?
 *
 * Rules:
 *  - ADMIN  can manage STUDENT, FACULTY, EDITOR, ADMIN — NOT SUPERADMIN.
 *  - SUPERADMIN can manage anyone.
 *  - Everyone else: cannot manage users.
 *  - Users can never manage themselves (caller must add that check separately).
 */
export function canManageUser(actorRole: string, targetRole: string): boolean {
  if (!isAdminOrHigher(actorRole)) return false
  if (isSuperAdmin(actorRole)) return true
  if (isSuperAdmin(targetRole)) return false // ADMIN cannot touch SUPERADMIN
  return true
}

/**
 * Can `actorRole` assign `targetRole` to another user?
 *
 * ADMIN     → STUDENT, FACULTY, EDITOR, ADMIN  (cannot assign SUPERADMIN)
 * SUPERADMIN → all five roles
 * everyone else → nobody
 */
export function canAssignRole(actorRole: string, targetRole: UserRoleString): boolean {
  if (!isAdminOrHigher(actorRole)) return false
  if (isSuperAdmin(actorRole)) return true
  if (targetRole === 'SUPERADMIN') return false
  return true
}

// ─── Resource-level ownership helpers ────────────────────────────────────────
// These are used alongside DB queries — they confirm authorization after the
// resource has been fetched.  The actual query must still verify membership.

/**
 * A STUDENT can access a research record if they appear in studentAuthors.
 * A FACULTY can access a research record if they appear in facultyAuthors.
 * EDITOR/ADMIN/SUPERADMIN can access any record (visibility already filtered
 * by canViewAllResearch at query time).
 *
 * This helper only checks the role category — pair it with a real DB author check.
 */
export function mayAccessResearchRecord(role: string): boolean {
  return true // All authenticated roles may attempt access; DB query enforces membership
}

// ─── Compound action helpers ─────────────────────────────────────────────────

/**
 * Generic permission check — returns true if the actor can perform `action`.
 * Used for uniform logging / middleware checks.
 *
 * Actions: 'publish' | 'approve' | 'reject' | 'review' |
 *          'create_event' | 'manage_users' | 'approve_grant' |
 *          'pay_bill' | 'superadmin_override'
 */
export function hasPermission(
  role: string,
  action:
    | 'publish_research'
    | 'approve_research'
    | 'reject_research'
    | 'review_research'
    | 'create_event'
    | 'publish_event'
    | 'cancel_event'
    | 'manage_users'
    | 'assign_roles'
    | 'approve_grant'
    | 'complete_grant'
    | 'pay_bill'
    | 'approve_achievement'
    | 'override_verification'
    | 'superadmin_override'
): boolean {
  switch (action) {
    case 'publish_research':       return canPublishContent(role)
    case 'approve_research':       return canEditorialApprove(role)
    case 'reject_research':        return canEditorialApprove(role)
    case 'review_research':        return canReviewResearch(role)
    case 'create_event':           return canCreateEvent(role)
    case 'publish_event':          return canPublishEvent(role)
    case 'cancel_event':           return canCancelEvent(role)
    case 'manage_users':           return isAdminOrHigher(role)
    case 'assign_roles':           return isAdminOrHigher(role)
    case 'approve_grant':          return canApproveGrant(role)
    case 'complete_grant':         return canCompleteGrant(role)
    case 'pay_bill':               return canPayBill(role)
    case 'approve_achievement':    return canApproveAchievement(role)
    case 'override_verification':  return canAdminOverrideVerification(role)
    case 'superadmin_override':    return isSuperAdmin(role)
    default:                       return false
  }
}

// ─── Sidebar / navigation helpers ────────────────────────────────────────────

export function showAdminNav(role: string): boolean    { return isAdminOrHigher(role) }
export function showEditorNav(role: string): boolean   { return isEditorOrHigher(role) }
export function showFacultyNav(role: string): boolean  { return isFacultyOrHigher(role) }
export function showSuperAdminNav(role: string): boolean { return isSuperAdmin(role) }
