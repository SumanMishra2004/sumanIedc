/**
 * @file researchRouteHelpers.ts
 * @description Shared secure helpers used by all five research type API routes.
 *
 * Centralises:
 *  - IDOR-safe ownership checks (via userId, never email)
 *  - Role-based access decisions
 *  - Workflow state transition validation (via workflow engine)
 *  - Field-level allowlists (via field-allowlists)
 *  - Audit log dispatch
 *  - Centralized notification dispatch
 */

import { NextResponse } from 'next/server'
import {
  canViewAllResearch,
  canPublishContent,
  isEditorOrHigher,
  isAdminOrHigher,
  isFacultyOrHigher,
} from '@/lib/auth/permissions'
import {
  canAccessResearchRecord,
  isStudentAuthor,
  isFacultyAuthor,
} from '@/lib/auth/guard'
import {
  validateTeacherStatusTransition,
  validateJournalStatusTransition,
  validateBookChapterStatusTransition,
  validateConferenceStatusTransition,
  validatePatentStatusTransition,
  validateCopyrightStatusTransition,
  impliedJournalStatusFromTeacher,
  impliedBookChapterStatusFromTeacher,
  impliedConferenceStatusFromTeacher,
  impliedPatentStatusFromTeacher,
  impliedCopyrightStatusFromTeacher,
} from '@/lib/auth/workflow'
import {
  pickAllowedFields,
  getResearchUpdateAllowlist,
} from '@/lib/auth/field-allowlists'
import {
  writeAuditLog,
  auditResearchStatusChange,
  AuditActions,
  fromSession,
} from '@/lib/audit'
import {
  notifyResearchUpdateRequested,
  notifyResearchApproved,
  notifyResearchRejected,
  notifyResearchPublished,
  notifyResearchReviewStarted,
} from '@/lib/notifications'
import {
  TeacherStatus,
  JournalStatus,
  BookchapterStatus,
  ConferenceStatus,
  PatentStatus,
  CopyrightStatus,
  UserRole,
} from '@prisma/client'
import prisma from '@/lib/prisma'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ResearchType = 'journal' | 'book-chapter' | 'conference' | 'patent' | 'copyright'

export interface AuthorIds {
  studentAuthors: Array<{ userId: string }>
  facultyAuthors: Array<{ userId: string | null }>
}

export interface SessionUser {
  id: string
  role: string
  email: string
  name: string
}

// ─── IDOR-safe ownership check ────────────────────────────────────────────────

/**
 * Returns true if the session user may READ this research record.
 * Uses userId comparison — never email.
 *
 * EDITOR+ can read anything.
 * STUDENT can read if in studentAuthors.
 * FACULTY can read if in facultyAuthors.
 * Public records are readable without auth (caller must check isPublic first).
 */
export function canReadResearch(
  user: SessionUser,
  record: AuthorIds,
): boolean {
  return canAccessResearchRecord(
    user.id,
    user.role,
    record.studentAuthors,
    record.facultyAuthors,
  )
}

/**
 * Returns true if the session user may WRITE (update) this research record.
 *
 * EDITOR+ can update any record.
 * FACULTY can update records where they are in facultyAuthors.
 * STUDENT can update records where they are in studentAuthors (subject to lock checks).
 */
export function canWriteResearch(
  user: SessionUser,
  record: AuthorIds,
): boolean {
  if (isEditorOrHigher(user.role)) return true
  if (user.role === UserRole.FACULTY)
    return isFacultyAuthor(user.id, record.facultyAuthors)
  if (user.role === UserRole.STUDENT)
    return isStudentAuthor(user.id, record.studentAuthors)
  return false
}

// ─── Student edit lock check ──────────────────────────────────────────────────

/**
 * Returns true if the record is locked for student edits.
 * A record is locked once faculty/editor has accepted, published, or rejected it —
 * UNLESS the status is UPDATE (revision requested).
 */
export function isLockedForStudent(
  teacherStatus: TeacherStatus,
  mainStatusIsPublished: boolean,
): boolean {
  if (mainStatusIsPublished) return true
  if (teacherStatus === TeacherStatus.UPDATE) return false // explicitly unlocked for revision
  if (
    teacherStatus === TeacherStatus.ACCEPTED ||
    teacherStatus === TeacherStatus.PUBLISHED ||
    teacherStatus === TeacherStatus.REJECTED
  )
    return true
  return false
}

// ─── Generic publish guard ────────────────────────────────────────────────────

export function assertCanPublish(role: string): NextResponse | null {
  if (!canPublishContent(role)) {
    return NextResponse.json(
      { error: 'Forbidden — only EDITOR or higher can publish research' },
      { status: 403 },
    )
  }
  return null
}

// ─── TeacherStatus + main-status combined validator ───────────────────────────

export interface StatusChangeResult {
  error?: NextResponse
  newTeacherStatus?: TeacherStatus
  impliedMainStatus?: string
  autoUpdateComment?: null
}

/**
 * Validates both TeacherStatus and main research status transitions together.
 * Returns either a 400/403 error response or the computed side-effects.
 */
export function validateResearchStatusChange(
  role: string,
  resourceType: ResearchType,
  currentTeacherStatus: TeacherStatus,
  currentMainStatus: string,
  newTeacherStatus: TeacherStatus | undefined,
  newMainStatus: string | undefined,
): StatusChangeResult {
  let impliedMain: string | null = null

  // ── TeacherStatus transition ────────────────────────────────────────────
  if (newTeacherStatus && newTeacherStatus !== currentTeacherStatus) {
    const tsResult = validateTeacherStatusTransition(role, currentTeacherStatus, newTeacherStatus)
    if (!tsResult.allowed) {
      return {
        error: NextResponse.json(
          { error: tsResult.reason },
          { status: tsResult.status },
        ),
      }
    }

    // Compute implied main-status from teacher transition
    switch (resourceType) {
      case 'journal':
        impliedMain = impliedJournalStatusFromTeacher(
          newTeacherStatus,
          currentMainStatus as JournalStatus,
        )
        break
      case 'book-chapter':
        impliedMain = impliedBookChapterStatusFromTeacher(
          newTeacherStatus,
          currentMainStatus as BookchapterStatus,
        )
        break
      case 'conference':
        impliedMain = impliedConferenceStatusFromTeacher(
          newTeacherStatus,
          currentMainStatus as ConferenceStatus,
        )
        break
      case 'patent':
        impliedMain = impliedPatentStatusFromTeacher(
          newTeacherStatus,
          currentMainStatus as PatentStatus,
        )
        break
      case 'copyright':
        impliedMain = impliedCopyrightStatusFromTeacher(
          newTeacherStatus,
          currentMainStatus as CopyrightStatus,
        )
        break
    }
  }

  // ── Main status transition ──────────────────────────────────────────────
  if (newMainStatus && newMainStatus !== currentMainStatus) {
    let mainResult
    switch (resourceType) {
      case 'journal':
        mainResult = validateJournalStatusTransition(
          role,
          currentMainStatus as JournalStatus,
          newMainStatus as JournalStatus,
        )
        break
      case 'book-chapter':
        mainResult = validateBookChapterStatusTransition(
          role,
          currentMainStatus as BookchapterStatus,
          newMainStatus as BookchapterStatus,
        )
        break
      case 'conference':
        mainResult = validateConferenceStatusTransition(
          role,
          currentMainStatus as ConferenceStatus,
          newMainStatus as ConferenceStatus,
        )
        break
      case 'patent':
        mainResult = validatePatentStatusTransition(
          role,
          currentMainStatus as PatentStatus,
          newMainStatus as PatentStatus,
        )
        break
      case 'copyright':
        mainResult = validateCopyrightStatusTransition(
          role,
          currentMainStatus as CopyrightStatus,
          newMainStatus as CopyrightStatus,
        )
        break
      default:
        mainResult = { allowed: true } as const
    }
    if (!mainResult.allowed) {
      return {
        error: NextResponse.json(
          { error: (mainResult as { allowed: false; reason: string; status: number }).reason },
          { status: (mainResult as { allowed: false; reason: string; status: number }).status },
        ),
      }
    }
  }

  return {
    newTeacherStatus,
    impliedMainStatus: impliedMain ?? undefined,
  }
}

// ─── Notification dispatch after status change ────────────────────────────────

export async function dispatchResearchStatusNotifications(params: {
  resourceType:       ResearchType
  resourceId:         string
  title:              string
  oldTeacherStatus:   TeacherStatus
  newTeacherStatus:   TeacherStatus | undefined
  oldMainStatus:      string
  newMainStatus:      string | undefined
  updateComment?:     string | null
  allAuthorIds:       string[]
  sessionUserId:      string
  sessionRole:        string
}): Promise<void> {
  const {
    resourceType, resourceId, title,
    oldTeacherStatus, newTeacherStatus,
    oldMainStatus, newMainStatus,
    updateComment, allAuthorIds,
    sessionUserId, sessionRole,
  } = params

  // Fetch admin IDs for notifications requiring admin awareness
  const adminIds = (
    await prisma.user.findMany({
      where: { role: { in: [UserRole.ADMIN, UserRole.SUPERADMIN] } },
      select: { id: true },
    })
  ).map((a) => a.id)

  const authorIds = allAuthorIds.filter((id) => id && id !== sessionUserId)

  if (newTeacherStatus && newTeacherStatus !== oldTeacherStatus) {
    switch (newTeacherStatus) {
      case TeacherStatus.ACCEPTED:
        await notifyResearchApproved({
          resourceType,
          resourceId,
          title,
          authorIds,
          adminIds,
        })
        break
      case TeacherStatus.UPDATE:
        await notifyResearchUpdateRequested({
          resourceType,
          resourceId,
          title,
          authorIds,
          updateComment: updateComment || 'Please review and resubmit.',
        })
        break
      case TeacherStatus.REJECTED:
        await notifyResearchRejected({
          resourceType,
          resourceId,
          title,
          authorIds,
          reason: updateComment ?? undefined,
        })
        break
      case TeacherStatus.UPLOADED:
        await notifyResearchReviewStarted({
          resourceType,
          resourceId,
          title,
          authorIds,
        })
        break
    }
  }

  if (newMainStatus && newMainStatus !== oldMainStatus) {
    const isPublishedState =
      newMainStatus === 'PUBLISHED' || newMainStatus === 'GRANTED'
    if (isPublishedState) {
      await notifyResearchPublished({
        resourceType,
        resourceId,
        title,
        authorIds: allAuthorIds,
      })
    }
  }
}

// ─── Audit helper ─────────────────────────────────────────────────────────────

export async function auditResearchChange(params: {
  session:      { user: { id: string; email: string; role: string } }
  resourceType: string
  resourceId:   string
  oldStatus:    string
  newStatus:    string
  action:       (typeof AuditActions)[keyof typeof AuditActions]
  ipAddress?:   string | null
}): Promise<void> {
  await auditResearchStatusChange({
    session:      params.session,
    action:       params.action,
    resourceType: params.resourceType,
    resourceId:   params.resourceId,
    oldStatus:    params.oldStatus,
    newStatus:    params.newStatus,
    ipAddress:    params.ipAddress ?? null,
  })
}

// ─── Author ID helpers ────────────────────────────────────────────────────────

export function allAuthorUserIds(
  studentAuthors: Array<{ userId: string }>,
  facultyAuthors: Array<{ userId: string | null }>,
): string[] {
  return [
    ...studentAuthors.map((sa) => sa.userId),
    ...facultyAuthors.map((fa) => fa.userId).filter((id): id is string => id !== null),
  ]
}
