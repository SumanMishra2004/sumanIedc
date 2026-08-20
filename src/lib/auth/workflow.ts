/**
 * @file workflow.ts
 * @description Centralized state-transition engine for every research workflow.
 *
 * SECURITY CONTRACT:
 *  - Never accept a status value directly from client input without passing it
 *    through these validators first.
 *  - Every transition is validated against the current state, the requesting
 *    role, and resource-specific business rules.
 *  - Transitions that would violate invariants return a typed error result.
 *
 * Supported workflows:
 *  - Journal (JournalStatus + TeacherStatus)
 *  - BookChapter (BookchapterStatus + TeacherStatus)
 *  - Conference (ConferenceStatus + TeacherStatus)
 *  - Patent (PatentStatus + TeacherStatus)
 *  - Copyright (CopyrightStatus + TeacherStatus)
 *  - GrantIn (GrantInStatus)
 *  - GrantInBill (BillStatus)
 *  - Achievement (AchievementStatus)
 *  - Event (EventStatus)
 */

import {
  JournalStatus,
  BookchapterStatus,
  ConferenceStatus,
  PatentStatus,
  CopyrightStatus,
  TeacherStatus,
  GrantInStatus,
  BillStatus,
  AchievementStatus,
  EventStatus,
} from '@prisma/client'
import {
  canPublishContent,
  canEditorialApprove,
  canApproveGrant,
  canCompleteGrant,
  canApproveAchievement,
  canManageEvents,
  isAdminOrHigher,
  isFacultyOrHigher,
  isStudent,
} from '@/lib/auth/permissions'

// ─── Result type ──────────────────────────────────────────────────────────────

export type TransitionResult =
  | { allowed: true }
  | { allowed: false; reason: string; status: 400 | 403 }

const allow = (): TransitionResult => ({ allowed: true })
const deny = (reason: string, status: 400 | 403 = 403): TransitionResult => ({
  allowed: false,
  reason,
  status,
})

// ─── TeacherStatus (faculty review layer) ────────────────────────────────────
// Used by all five research types as the faculty-facing review status.
// Allowed transitions by role:

const TEACHER_STATUS_TRANSITIONS: Record<
  TeacherStatus,
  Partial<Record<TeacherStatus, UserRoleString[]>>
> = {
  UPLOADED: {
    ACCEPTED: ['FACULTY', 'EDITOR', 'ADMIN', 'SUPERADMIN'],
    UPDATE:   ['FACULTY', 'EDITOR', 'ADMIN', 'SUPERADMIN'],
    REJECTED: ['FACULTY', 'EDITOR', 'ADMIN', 'SUPERADMIN'],
  },
  UPDATE: {
    // Author resubmits (goes back to UPLOADED) — handled automatically by routes
    UPLOADED: ['STUDENT', 'FACULTY', 'EDITOR', 'ADMIN', 'SUPERADMIN'],
    REJECTED: ['FACULTY', 'EDITOR', 'ADMIN', 'SUPERADMIN'],
  },
  ACCEPTED: {
    UPDATE:   ['EDITOR', 'ADMIN', 'SUPERADMIN'],
    REJECTED: ['EDITOR', 'ADMIN', 'SUPERADMIN'],
    PUBLISHED: ['EDITOR', 'ADMIN', 'SUPERADMIN'],
  },
  PUBLISHED: {
    // Terminal — no transitions allowed
  },
  REJECTED: {
    // Terminal — only SUPERADMIN override allowed
    UPLOADED: ['SUPERADMIN'],
  },
}

type UserRoleString = 'STUDENT' | 'FACULTY' | 'EDITOR' | 'ADMIN' | 'SUPERADMIN'

/**
 * Validates a TeacherStatus transition.
 */
export function validateTeacherStatusTransition(
  role: string,
  current: TeacherStatus,
  next: TeacherStatus,
): TransitionResult {
  if (current === next) return allow()

  const allowed = TEACHER_STATUS_TRANSITIONS[current]?.[next]
  if (!allowed) {
    return deny(
      `Invalid status transition: ${current} → ${next}`,
      400,
    )
  }
  if (!allowed.includes(role as UserRoleString)) {
    return deny(
      `Your role (${role}) cannot transition teacher status from ${current} to ${next}`,
    )
  }
  return allow()
}

// ─── Journal workflow ─────────────────────────────────────────────────────────

const JOURNAL_STATUS_TRANSITIONS: Record<
  JournalStatus,
  Partial<Record<JournalStatus, UserRoleString[]>>
> = {
  SUBMITTED: {
    UNDER_REVIEW: ['EDITOR', 'ADMIN', 'SUPERADMIN'],
  },
  UNDER_REVIEW: {
    APPROVED:     ['EDITOR', 'ADMIN', 'SUPERADMIN'],
    SUBMITTED:    ['EDITOR', 'ADMIN', 'SUPERADMIN'], // send back for revision
  },
  APPROVED: {
    PUBLISHED:    ['EDITOR', 'ADMIN', 'SUPERADMIN'],
    UNDER_REVIEW: ['EDITOR', 'ADMIN', 'SUPERADMIN'], // re-open for review
  },
  PUBLISHED: {
    // Terminal — only SUPERADMIN override allowed
    APPROVED: ['SUPERADMIN'],
  },
}

export function validateJournalStatusTransition(
  role: string,
  current: JournalStatus,
  next: JournalStatus,
): TransitionResult {
  if (current === next) return allow()

  const allowed = JOURNAL_STATUS_TRANSITIONS[current]?.[next]
  if (!allowed) {
    return deny(`Invalid journal status transition: ${current} → ${next}`, 400)
  }
  if (!allowed.includes(role as UserRoleString)) {
    return deny(`Your role (${role}) cannot transition journal status from ${current} to ${next}`)
  }
  if (next === 'PUBLISHED' && !canPublishContent(role)) {
    return deny('Only EDITOR or higher can publish research')
  }
  return allow()
}

// ─── Book Chapter workflow ────────────────────────────────────────────────────

const BOOK_CHAPTER_STATUS_TRANSITIONS: Record<
  BookchapterStatus,
  Partial<Record<BookchapterStatus, UserRoleString[]>>
> = {
  SUBMITTED: {
    UNDER_REVIEW: ['EDITOR', 'ADMIN', 'SUPERADMIN'],
  },
  UNDER_REVIEW: {
    APPROVED:     ['EDITOR', 'ADMIN', 'SUPERADMIN'],
    SUBMITTED:    ['EDITOR', 'ADMIN', 'SUPERADMIN'],
  },
  APPROVED: {
    PUBLISHED:    ['EDITOR', 'ADMIN', 'SUPERADMIN'],
    UNDER_REVIEW: ['EDITOR', 'ADMIN', 'SUPERADMIN'],
  },
  PUBLISHED: {
    APPROVED: ['SUPERADMIN'],
  },
}

export function validateBookChapterStatusTransition(
  role: string,
  current: BookchapterStatus,
  next: BookchapterStatus,
): TransitionResult {
  if (current === next) return allow()

  const allowed = BOOK_CHAPTER_STATUS_TRANSITIONS[current]?.[next]
  if (!allowed) {
    return deny(`Invalid book chapter status transition: ${current} → ${next}`, 400)
  }
  if (!allowed.includes(role as UserRoleString)) {
    return deny(`Your role (${role}) cannot transition book chapter status from ${current} to ${next}`)
  }
  if (next === 'PUBLISHED' && !canPublishContent(role)) {
    return deny('Only EDITOR or higher can publish research')
  }
  return allow()
}

// ─── Conference workflow ──────────────────────────────────────────────────────

const CONFERENCE_STATUS_TRANSITIONS: Record<
  ConferenceStatus,
  Partial<Record<ConferenceStatus, UserRoleString[]>>
> = {
  SUBMITTED: {
    UNDER_REVIEW: ['EDITOR', 'ADMIN', 'SUPERADMIN'],
  },
  UNDER_REVIEW: {
    APPROVED:     ['EDITOR', 'ADMIN', 'SUPERADMIN'],
    SUBMITTED:    ['EDITOR', 'ADMIN', 'SUPERADMIN'],
  },
  APPROVED: {
    PRESENTED:    ['EDITOR', 'ADMIN', 'SUPERADMIN'],
    UNDER_REVIEW: ['EDITOR', 'ADMIN', 'SUPERADMIN'],
  },
  PRESENTED: {
    PUBLISHED:    ['EDITOR', 'ADMIN', 'SUPERADMIN'],
    APPROVED:     ['EDITOR', 'ADMIN', 'SUPERADMIN'],
  },
  PUBLISHED: {
    PRESENTED: ['SUPERADMIN'],
  },
}

export function validateConferenceStatusTransition(
  role: string,
  current: ConferenceStatus,
  next: ConferenceStatus,
): TransitionResult {
  if (current === next) return allow()

  const allowed = CONFERENCE_STATUS_TRANSITIONS[current]?.[next]
  if (!allowed) {
    return deny(`Invalid conference status transition: ${current} → ${next}`, 400)
  }
  if (!allowed.includes(role as UserRoleString)) {
    return deny(`Your role (${role}) cannot transition conference status from ${current} to ${next}`)
  }
  if (next === 'PUBLISHED' && !canPublishContent(role)) {
    return deny('Only EDITOR or higher can publish research')
  }
  return allow()
}

// ─── Patent workflow ──────────────────────────────────────────────────────────

const PATENT_STATUS_TRANSITIONS: Record<
  PatentStatus,
  Partial<Record<PatentStatus, UserRoleString[]>>
> = {
  SUBMITTED: {
    UNDER_REVIEW: ['EDITOR', 'ADMIN', 'SUPERADMIN'],
  },
  UNDER_REVIEW: {
    APPROVED:     ['EDITOR', 'ADMIN', 'SUPERADMIN'],
    SUBMITTED:    ['EDITOR', 'ADMIN', 'SUPERADMIN'],
  },
  APPROVED: {
    GRANTED:      ['EDITOR', 'ADMIN', 'SUPERADMIN'],
    UNDER_REVIEW: ['EDITOR', 'ADMIN', 'SUPERADMIN'],
  },
  GRANTED: {
    APPROVED: ['SUPERADMIN'],
  },
}

export function validatePatentStatusTransition(
  role: string,
  current: PatentStatus,
  next: PatentStatus,
): TransitionResult {
  if (current === next) return allow()

  const allowed = PATENT_STATUS_TRANSITIONS[current]?.[next]
  if (!allowed) {
    return deny(`Invalid patent status transition: ${current} → ${next}`, 400)
  }
  if (!allowed.includes(role as UserRoleString)) {
    return deny(`Your role (${role}) cannot transition patent status from ${current} to ${next}`)
  }
  return allow()
}

// ─── Copyright workflow ───────────────────────────────────────────────────────

const COPYRIGHT_STATUS_TRANSITIONS: Record<
  CopyrightStatus,
  Partial<Record<CopyrightStatus, UserRoleString[]>>
> = {
  SUBMITTED: {
    UNDER_REVIEW: ['EDITOR', 'ADMIN', 'SUPERADMIN'],
  },
  UNDER_REVIEW: {
    APPROVED:     ['EDITOR', 'ADMIN', 'SUPERADMIN'],
    SUBMITTED:    ['EDITOR', 'ADMIN', 'SUPERADMIN'],
  },
  APPROVED: {
    PUBLISHED:    ['EDITOR', 'ADMIN', 'SUPERADMIN'],
    UNDER_REVIEW: ['EDITOR', 'ADMIN', 'SUPERADMIN'],
  },
  PUBLISHED: {
    APPROVED: ['SUPERADMIN'],
  },
}

export function validateCopyrightStatusTransition(
  role: string,
  current: CopyrightStatus,
  next: CopyrightStatus,
): TransitionResult {
  if (current === next) return allow()

  const allowed = COPYRIGHT_STATUS_TRANSITIONS[current]?.[next]
  if (!allowed) {
    return deny(`Invalid copyright status transition: ${current} → ${next}`, 400)
  }
  if (!allowed.includes(role as UserRoleString)) {
    return deny(`Your role (${role}) cannot transition copyright status from ${current} to ${next}`)
  }
  if (next === 'PUBLISHED' && !canPublishContent(role)) {
    return deny('Only EDITOR or higher can publish research')
  }
  return allow()
}

// ─── Grant-In workflow ────────────────────────────────────────────────────────

const GRANT_STATUS_TRANSITIONS: Record<
  GrantInStatus,
  Partial<Record<GrantInStatus, UserRoleString[]>>
> = {
  APPLIED: {
    GRANTED:  ['ADMIN', 'SUPERADMIN'],
    REJECTED: ['ADMIN', 'SUPERADMIN'],
  },
  GRANTED: {
    COMPLETED: ['ADMIN', 'SUPERADMIN'],
    APPLIED:   ['SUPERADMIN'], // emergency override only
  },
  REJECTED: {
    APPLIED: ['SUPERADMIN'], // allow re-application via SUPERADMIN override
  },
  COMPLETED: {
    // Terminal — SUPERADMIN can re-open only in emergency
    GRANTED: ['SUPERADMIN'],
  },
}

export function validateGrantStatusTransition(
  role: string,
  current: GrantInStatus,
  next: GrantInStatus,
): TransitionResult {
  if (current === next) return allow()

  const allowed = GRANT_STATUS_TRANSITIONS[current]?.[next]
  if (!allowed) {
    return deny(`Invalid grant status transition: ${current} → ${next}`, 400)
  }
  if (!allowed.includes(role as UserRoleString)) {
    return deny(`Your role (${role}) cannot transition grant status from ${current} to ${next}`)
  }
  if ((next === 'GRANTED' || next === 'COMPLETED') && !canApproveGrant(role)) {
    return deny('Only ADMIN or higher can approve or complete grants')
  }
  return allow()
}

// ─── Bill workflow ────────────────────────────────────────────────────────────

const BILL_STATUS_TRANSITIONS: Record<
  BillStatus,
  Partial<Record<BillStatus, UserRoleString[]>>
> = {
  PENDING: {
    // Faculty PI/CoPI can ACCEPT bills in their own grant
    // ADMIN can also accept/reject
    ACCEPTED: ['FACULTY', 'EDITOR', 'ADMIN', 'SUPERADMIN'],
    REJECTED: ['FACULTY', 'EDITOR', 'ADMIN', 'SUPERADMIN'],
  },
  ACCEPTED: {
    // Only ADMIN can mark a bill PAID (financial disbursement)
    PAID:    ['ADMIN', 'SUPERADMIN'],
    PENDING: ['ADMIN', 'SUPERADMIN'], // correction
  },
  REJECTED: {
    // Can be re-submitted by owner but that creates a new bill record
    PENDING: ['ADMIN', 'SUPERADMIN'],
  },
  PAID: {
    // Terminal — only SUPERADMIN can reverse for audit purposes
    ACCEPTED: ['SUPERADMIN'],
  },
}

export function validateBillStatusTransition(
  role: string,
  current: BillStatus,
  next: BillStatus,
): TransitionResult {
  if (current === next) return allow()

  const allowed = BILL_STATUS_TRANSITIONS[current]?.[next]
  if (!allowed) {
    return deny(`Invalid bill status transition: ${current} → ${next}`, 400)
  }
  if (!allowed.includes(role as UserRoleString)) {
    return deny(`Your role (${role}) cannot transition bill status from ${current} to ${next}`)
  }
  if (next === 'PAID' && !isAdminOrHigher(role)) {
    return deny('Only ADMIN or higher can mark a bill as paid')
  }
  return allow()
}

// ─── Achievement workflow ─────────────────────────────────────────────────────

const ACHIEVEMENT_STATUS_TRANSITIONS: Record<
  AchievementStatus,
  Partial<Record<AchievementStatus, UserRoleString[]>>
> = {
  SUBMITTED: {
    UNDER_REVIEW: ['EDITOR', 'ADMIN', 'SUPERADMIN'],
  },
  UNDER_REVIEW: {
    APPROVED:  ['EDITOR', 'ADMIN', 'SUPERADMIN'],
    REJECTED:  ['EDITOR', 'ADMIN', 'SUPERADMIN'],
    SUBMITTED: ['EDITOR', 'ADMIN', 'SUPERADMIN'], // send back for revision
  },
  APPROVED: {
    UNDER_REVIEW: ['ADMIN', 'SUPERADMIN'], // admin can re-review
    REJECTED:     ['ADMIN', 'SUPERADMIN'],
  },
  REJECTED: {
    SUBMITTED: ['STUDENT', 'FACULTY'], // owner can resubmit
    UNDER_REVIEW: ['ADMIN', 'SUPERADMIN'],
  },
}

export function validateAchievementStatusTransition(
  role: string,
  current: AchievementStatus,
  next: AchievementStatus,
): TransitionResult {
  if (current === next) return allow()

  const allowed = ACHIEVEMENT_STATUS_TRANSITIONS[current]?.[next]
  if (!allowed) {
    return deny(`Invalid achievement status transition: ${current} → ${next}`, 400)
  }
  if (!allowed.includes(role as UserRoleString)) {
    return deny(`Your role (${role}) cannot transition achievement status from ${current} to ${next}`)
  }
  if (next === 'APPROVED' && !canApproveAchievement(role)) {
    return deny('Only EDITOR or higher can approve achievements')
  }
  return allow()
}

// ─── Event workflow ───────────────────────────────────────────────────────────

const EVENT_STATUS_TRANSITIONS: Record<
  EventStatus,
  Partial<Record<EventStatus, UserRoleString[]>>
> = {
  DRAFT: {
    PUBLISHED: ['EDITOR', 'ADMIN', 'SUPERADMIN'],
  },
  PUBLISHED: {
    CANCELLED: ['EDITOR', 'ADMIN', 'SUPERADMIN'],
    ARCHIVED:  ['EDITOR', 'ADMIN', 'SUPERADMIN'],
    DRAFT:     ['ADMIN', 'SUPERADMIN'], // pull back to draft
  },
  CANCELLED: {
    ARCHIVED:  ['EDITOR', 'ADMIN', 'SUPERADMIN'],
    PUBLISHED: ['ADMIN', 'SUPERADMIN'], // re-activate
  },
  ARCHIVED: {
    // Terminal — only SUPERADMIN can unarchive
    PUBLISHED: ['SUPERADMIN'],
  },
}

export function validateEventStatusTransition(
  role: string,
  current: EventStatus,
  next: EventStatus,
): TransitionResult {
  if (current === next) return allow()

  const allowed = EVENT_STATUS_TRANSITIONS[current]?.[next]
  if (!allowed) {
    return deny(`Invalid event status transition: ${current} → ${next}`, 400)
  }
  if (!allowed.includes(role as UserRoleString)) {
    return deny(`Your role (${role}) cannot transition event status from ${current} to ${next}`)
  }
  if (next === 'PUBLISHED' && !canManageEvents(role)) {
    return deny('Only EDITOR or higher can publish events')
  }
  return allow()
}

// ─── Automated status side-effects ───────────────────────────────────────────
// When a TeacherStatus changes, it may automatically change the research
// main status. These helpers compute the implied main-status change.

/**
 * Given the new TeacherStatus for a Journal, returns the implied JournalStatus
 * update (if any).
 */
export function impliedJournalStatusFromTeacher(
  newTeacherStatus: TeacherStatus,
  currentJournalStatus: JournalStatus,
): JournalStatus | null {
  switch (newTeacherStatus) {
    case TeacherStatus.ACCEPTED:
      // Faculty accepted → moves to editorial UNDER_REVIEW
      return JournalStatus.UNDER_REVIEW
    case TeacherStatus.PUBLISHED:
      return JournalStatus.PUBLISHED
    case TeacherStatus.UPLOADED:
      // Author resubmitted after UPDATE — stays at or returns to SUBMITTED
      return currentJournalStatus === JournalStatus.UNDER_REVIEW
        ? JournalStatus.SUBMITTED
        : null
    default:
      return null
  }
}

/**
 * Same pattern for BookChapter.
 */
export function impliedBookChapterStatusFromTeacher(
  newTeacherStatus: TeacherStatus,
  currentStatus: BookchapterStatus,
): BookchapterStatus | null {
  switch (newTeacherStatus) {
    case TeacherStatus.ACCEPTED:  return BookchapterStatus.UNDER_REVIEW
    case TeacherStatus.PUBLISHED: return BookchapterStatus.PUBLISHED
    case TeacherStatus.UPLOADED:
      return currentStatus === BookchapterStatus.UNDER_REVIEW
        ? BookchapterStatus.SUBMITTED
        : null
    default: return null
  }
}

/**
 * Same pattern for Conference.
 */
export function impliedConferenceStatusFromTeacher(
  newTeacherStatus: TeacherStatus,
  currentStatus: ConferenceStatus,
): ConferenceStatus | null {
  switch (newTeacherStatus) {
    case TeacherStatus.ACCEPTED:  return ConferenceStatus.UNDER_REVIEW
    case TeacherStatus.PUBLISHED: return ConferenceStatus.PUBLISHED
    case TeacherStatus.UPLOADED:
      return currentStatus === ConferenceStatus.UNDER_REVIEW
        ? ConferenceStatus.SUBMITTED
        : null
    default: return null
  }
}

/**
 * Same pattern for Patent.
 */
export function impliedPatentStatusFromTeacher(
  newTeacherStatus: TeacherStatus,
  currentStatus: PatentStatus,
): PatentStatus | null {
  switch (newTeacherStatus) {
    case TeacherStatus.ACCEPTED:  return PatentStatus.UNDER_REVIEW
    case TeacherStatus.UPLOADED:
      return currentStatus === PatentStatus.UNDER_REVIEW
        ? PatentStatus.SUBMITTED
        : null
    default: return null
  }
}

/**
 * Same pattern for Copyright.
 */
export function impliedCopyrightStatusFromTeacher(
  newTeacherStatus: TeacherStatus,
  currentStatus: CopyrightStatus,
): CopyrightStatus | null {
  switch (newTeacherStatus) {
    case TeacherStatus.ACCEPTED:  return CopyrightStatus.UNDER_REVIEW
    case TeacherStatus.PUBLISHED: return CopyrightStatus.PUBLISHED
    case TeacherStatus.UPLOADED:
      return currentStatus === CopyrightStatus.UNDER_REVIEW
        ? CopyrightStatus.SUBMITTED
        : null
    default: return null
  }
}
