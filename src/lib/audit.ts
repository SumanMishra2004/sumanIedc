/**
 * @file audit.ts
 * @description Append-only audit log service.
 *
 * SECURITY CONTRACT:
 *  - Audit records are NEVER modified or deleted by normal application code.
 *  - Only SUPERADMIN roles with direct DB access can perform corrections.
 *  - Every significant action — role changes, research publication, grant
 *    approval, bill payment, administrative overrides, SUPERADMIN actions —
 *    MUST be recorded here.
 *  - Failures in audit logging must NEVER block the primary operation.
 *    Log the error and continue (fire-and-forget pattern for non-critical paths).
 *  - Do NOT store raw passwords, full document content, or other secrets.
 */

import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

type JsonValue = Prisma.InputJsonValue

// ─── Action constants ─────────────────────────────────────────────────────────
// Keep in sync with AuditAction enum in schema.prisma

export const AuditActions = {
  // Auth / Users
  USER_REGISTERED:               'USER_REGISTERED',
  USER_ROLE_CHANGED:             'USER_ROLE_CHANGED',
  USER_DELETED:                  'USER_DELETED',
  // Research
  RESEARCH_SUBMITTED:            'RESEARCH_SUBMITTED',
  RESEARCH_REVIEW_STARTED:       'RESEARCH_REVIEW_STARTED',
  RESEARCH_UPDATE_REQUESTED:     'RESEARCH_UPDATE_REQUESTED',
  RESEARCH_APPROVED:             'RESEARCH_APPROVED',
  RESEARCH_REJECTED:             'RESEARCH_REJECTED',
  RESEARCH_PUBLISHED:            'RESEARCH_PUBLISHED',
  // Grants
  GRANT_CREATED:                 'GRANT_CREATED',
  GRANT_APPROVED:                'GRANT_APPROVED',
  GRANT_REJECTED:                'GRANT_REJECTED',
  GRANT_COMPLETED:               'GRANT_COMPLETED',
  GRANT_TEAM_UPDATED:            'GRANT_TEAM_UPDATED',
  // Bills
  BILL_SUBMITTED:                'BILL_SUBMITTED',
  BILL_ACCEPTED:                 'BILL_ACCEPTED',
  BILL_REJECTED:                 'BILL_REJECTED',
  BILL_PAID:                     'BILL_PAID',
  // Achievements
  ACHIEVEMENT_SUBMITTED:         'ACHIEVEMENT_SUBMITTED',
  ACHIEVEMENT_APPROVED:          'ACHIEVEMENT_APPROVED',
  ACHIEVEMENT_REJECTED:          'ACHIEVEMENT_REJECTED',
  // Events
  EVENT_CREATED:                 'EVENT_CREATED',
  EVENT_PUBLISHED:               'EVENT_PUBLISHED',
  EVENT_CANCELLED:               'EVENT_CANCELLED',
  EVENT_ARCHIVED:                'EVENT_ARCHIVED',
  // Faculty verification
  FACULTY_VERIFICATION_CREATED:  'FACULTY_VERIFICATION_CREATED',
  FACULTY_VERIFICATION_ACCEPTED: 'FACULTY_VERIFICATION_ACCEPTED',
  FACULTY_VERIFICATION_REJECTED: 'FACULTY_VERIFICATION_REJECTED',
  FACULTY_VERIFICATION_OVERRIDE: 'FACULTY_VERIFICATION_OVERRIDE',
  // Grant mapping
  GRANT_MAPPING_CREATED:         'GRANT_MAPPING_CREATED',
  GRANT_MAPPING_DELETED:         'GRANT_MAPPING_DELETED',
  // Admin overrides
  ADMIN_OVERRIDE:                'ADMIN_OVERRIDE',
  SUPERADMIN_OVERRIDE:           'SUPERADMIN_OVERRIDE',
} as const

export type AuditActionKey = (typeof AuditActions)[keyof typeof AuditActions]

// ─── Log entry params ─────────────────────────────────────────────────────────

export interface AuditLogParams {
  actorId?:      string | null
  actorEmail?:   string | null
  actorRole?:    string | null
  action:        AuditActionKey
  resourceType:  string
  resourceId:    string
  oldValue?:     Record<string, unknown> | null
  newValue?:     Record<string, unknown> | null
  reason?:       string | null
  ipAddress?:    string | null
  metadata?:     Record<string, unknown> | null
}

// ─── Core write function ──────────────────────────────────────────────────────

/**
 * Appends a record to the audit log.
 *
 * This function is intentionally fire-and-forget for non-blocking callers.
 * Pass `await` when you need to ensure the record was written (e.g., before
 * returning a response for a SUPERADMIN override action).
 *
 * Never throws — all errors are logged to stderr only.
 */
export async function writeAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId:      params.actorId    ?? null,
        actorEmail:   params.actorEmail ?? null,
        actorRole:    params.actorRole  ?? null,
        action:       params.action,
        resourceType: params.resourceType,
        resourceId:   params.resourceId,
        oldValue:     (params.oldValue ?? undefined) as JsonValue | undefined,
        newValue:     (params.newValue ?? undefined) as JsonValue | undefined,
        reason:       params.reason     ?? null,
        ipAddress:    params.ipAddress  ?? null,
        metadata:     (params.metadata  ?? undefined) as JsonValue | undefined,
      },
    })
  } catch (err) {
    // Audit failures must never break primary operations
    console.error('[AuditLog] Failed to write audit record:', params.action, params.resourceType, params.resourceId, err)
  }
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

/**
 * Helper that constructs actor info from a session object.
 */
export function fromSession(session: {
  user: { id: string; email: string; role: string }
}): Pick<AuditLogParams, 'actorId' | 'actorEmail' | 'actorRole'> {
  return {
    actorId:    session.user.id,
    actorEmail: session.user.email,
    actorRole:  session.user.role,
  }
}

/**
 * Logs a research status change.
 */
export async function auditResearchStatusChange(params: {
  session:      { user: { id: string; email: string; role: string } }
  action:       AuditActionKey
  resourceType: string
  resourceId:   string
  oldStatus:    string
  newStatus:    string
  reason?:      string | null
  ipAddress?:   string | null
}): Promise<void> {
  await writeAuditLog({
    ...fromSession(params.session),
    action:       params.action,
    resourceType: params.resourceType,
    resourceId:   params.resourceId,
    oldValue:     { status: params.oldStatus },
    newValue:     { status: params.newStatus },
    reason:       params.reason ?? null,
    ipAddress:    params.ipAddress ?? null,
  })
}

/**
 * Logs a role change event (always awaited — security-sensitive).
 */
export async function auditRoleChange(params: {
  actorId:      string
  actorEmail:   string
  actorRole:    string
  targetUserId: string
  targetEmail:  string
  oldRole:      string
  newRole:      string
  ipAddress?:   string | null
}): Promise<void> {
  await writeAuditLog({
    actorId:      params.actorId,
    actorEmail:   params.actorEmail,
    actorRole:    params.actorRole,
    action:       AuditActions.USER_ROLE_CHANGED,
    resourceType: 'User',
    resourceId:   params.targetUserId,
    oldValue:     { role: params.oldRole, email: params.targetEmail },
    newValue:     { role: params.newRole, email: params.targetEmail },
    ipAddress:    params.ipAddress ?? null,
  })
}

/**
 * Logs an administrative override (always awaited — requires reason).
 */
export async function auditAdminOverride(params: {
  session:      { user: { id: string; email: string; role: string } }
  resourceType: string
  resourceId:   string
  action:       AuditActionKey
  oldValue?:    Record<string, unknown>
  newValue?:    Record<string, unknown>
  reason:       string
  ipAddress?:   string | null
}): Promise<void> {
  await writeAuditLog({
    ...fromSession(params.session),
    action:       params.action,
    resourceType: params.resourceType,
    resourceId:   params.resourceId,
    oldValue:     params.oldValue ?? null,
    newValue:     params.newValue ?? null,
    reason:       params.reason,
    ipAddress:    params.ipAddress ?? null,
  })
}

/**
 * Logs a grant financial event (bill payment, grant approval).
 * Always awaited — financial integrity.
 */
export async function auditGrantFinancial(params: {
  session:      { user: { id: string; email: string; role: string } }
  action:       AuditActionKey
  resourceType: 'GrantIn' | 'GrantInBill'
  resourceId:   string
  oldValue?:    Record<string, unknown>
  newValue?:    Record<string, unknown>
  reason?:      string | null
  ipAddress?:   string | null
}): Promise<void> {
  await writeAuditLog({
    ...fromSession(params.session),
    action:       params.action,
    resourceType: params.resourceType,
    resourceId:   params.resourceId,
    oldValue:     params.oldValue ?? null,
    newValue:     params.newValue ?? null,
    reason:       params.reason ?? null,
    ipAddress:    params.ipAddress ?? null,
  })
}
