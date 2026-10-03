/**
 * @file journalHelpers.ts
 * @description Helper functions for journal workflow permissions and business logic
 */

import { Journal, JournalTeacherAuthor, JournalStudentAuthor, User } from '@prisma/client'
import { TeacherStatus, JournalStatus, JournalFacultyRole } from '@prisma/client'
import prisma from '@/lib/prisma'

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface JournalWithAuthors extends Journal {
  facultyAuthors: (JournalTeacherAuthor & { user: User | null })[]
  studentAuthors: (JournalStudentAuthor & { user: User })[]
}

export interface JournalPermissions {
  canView: boolean
  canEdit: boolean
  canUpdateStatus: boolean
  canPublish: boolean
  canDelete: boolean
  isPI: boolean
  isAuthor: boolean
}

// ─── Permission Helpers ──────────────────────────────────────────────────────

/**
 * Check if a user is the Principal Investigator of a journal
 */
export function isPI(journal: JournalWithAuthors, userId: string): boolean {
  return journal.facultyAuthors.some(
    (author) => author.userId === userId && author.role === JournalFacultyRole.PI
  )
}

/**
 * Check if a user is any faculty author (PI or Co-PI) of a journal
 */
export function isFacultyAuthor(journal: JournalWithAuthors, userId: string): boolean {
  return journal.facultyAuthors.some((author) => author.userId === userId)
}

/**
 * Check if a user is a student author of a journal
 */
export function isStudentAuthor(journal: JournalWithAuthors, userId: string): boolean {
  return journal.studentAuthors.some((author) => author.userId === userId)
}

/**
 * Check if a user is any author (faculty or student) of a journal
 */
export function isAuthor(journal: JournalWithAuthors, userId: string): boolean {
  return isFacultyAuthor(journal, userId) || isStudentAuthor(journal, userId)
}

/**
 * Get the PI of a journal
 */
export function getPI(journal: JournalWithAuthors): (JournalTeacherAuthor & { user: User | null }) | null {
  return journal.facultyAuthors.find((author) => author.role === JournalFacultyRole.PI) || null
}

/**
 * Check if user can view a journal based on role and authorship
 */
export function canViewJournal(
  journal: JournalWithAuthors,
  userId: string | null,
  userRole: string | null
): boolean {
  // Public journals can be viewed by anyone except when user is a student or unauthenticated
  if (journal.isPublic) {
    // If not authenticated, can view public journals
    if (!userId || !userRole) return true
    
    // Students can only view public journals
    if (userRole === 'STUDENT') return true
    
    // Faculty and above can view all public journals
    return true
  }

  // Non-public journals
  if (!userId || !userRole) return false

  // Authors can always view their own journals
  if (isAuthor(journal, userId)) return true

  // EDITOR, ADMIN, SUPERADMIN can view all journals
  if (['EDITOR', 'ADMIN', 'SUPERADMIN'].includes(userRole)) return true

  // FACULTY can view all journals
  if (userRole === 'FACULTY') return true

  return false
}

/**
 * Check if user can edit a journal
 */
export function canEditJournal(
  journal: JournalWithAuthors,
  userId: string,
  userRole: string
): boolean {
  // Once published, only EDITOR, ADMIN, SUPERADMIN can edit
  if (journal.teacherStatus === TeacherStatus.PUBLISHED) {
    return ['EDITOR', 'ADMIN', 'SUPERADMIN'].includes(userRole)
  }

  // Before publishing:
  // - PI can edit
  // - Co-PI faculty authors can edit
  // - Student authors can edit
  if (isAuthor(journal, userId)) return true

  // EDITOR, ADMIN, SUPERADMIN can always edit
  if (['EDITOR', 'ADMIN', 'SUPERADMIN'].includes(userRole)) return true

  return false
}

/**
 * Check if user can update journal status (accept/reject/request update)
 */
export function canUpdateJournalStatus(
  journal: JournalWithAuthors,
  userId: string,
  userRole: string
): boolean {
  // Only PI can accept/reject/request updates (after initial submission)
  if (isPI(journal, userId)) return true

  // EDITOR, ADMIN, SUPERADMIN can also update status
  if (['EDITOR', 'ADMIN', 'SUPERADMIN'].includes(userRole)) return true

  return false
}

/**
 * Check if user can publish a journal (make it public and set status to PUBLISHED)
 */
export function canPublishJournal(
  journal: JournalWithAuthors,
  userId: string,
  userRole: string
): boolean {
  // Only EDITOR, ADMIN, SUPERADMIN can publish
  // And only after PI has accepted it
  const canPublish = ['EDITOR', 'ADMIN', 'SUPERADMIN'].includes(userRole)
  const isAccepted = journal.teacherStatus === TeacherStatus.ACCEPTED

  return canPublish && isAccepted
}

/**
 * Check if user can resubmit a journal after an UPDATE request.
 * Only actual authors (student or faculty) can resubmit — editors/admins cannot.
 */
export function canResubmitJournal(
  journal: JournalWithAuthors,
  userId: string,
  userRole: string
): boolean {
  // Must be in UPDATE status to resubmit
  if (journal.teacherStatus !== TeacherStatus.UPDATE) return false
  // Only the actual authors (PI, Co-PI, student authors) can resubmit
  return isAuthor(journal, userId)
}

/**
 * Check if user can delete a journal
 */
export function canDeleteJournal(
  journal: JournalWithAuthors,
  userId: string,
  userRole: string
): boolean {
  // Published journals cannot be deleted by anyone except ADMIN and SUPERADMIN
  if (journal.teacherStatus === TeacherStatus.PUBLISHED) {
    return ['ADMIN', 'SUPERADMIN'].includes(userRole)
  }

  // Before publishing:
  // - PI can delete
  // - ADMIN, SUPERADMIN can delete
  if (isPI(journal, userId)) return true
  if (['ADMIN', 'SUPERADMIN'].includes(userRole)) return true

  return false
}

/**
 * Get comprehensive permissions for a user on a journal
 */
export function getJournalPermissions(
  journal: JournalWithAuthors,
  userId: string | null,
  userRole: string | null
): JournalPermissions {
  if (!userId || !userRole) {
    return {
      canView: journal.isPublic,
      canEdit: false,
      canUpdateStatus: false,
      canPublish: false,
      canDelete: false,
      isPI: false,
      isAuthor: false,
    }
  }

  return {
    canView: canViewJournal(journal, userId, userRole),
    canEdit: canEditJournal(journal, userId, userRole),
    canUpdateStatus: canUpdateJournalStatus(journal, userId, userRole),
    canPublish: canPublishJournal(journal, userId, userRole),
    canDelete: canDeleteJournal(journal, userId, userRole),
    isPI: isPI(journal, userId),
    isAuthor: isAuthor(journal, userId),
  }
}

// ─── Workflow State Helpers ──────────────────────────────────────────────────

/**
 * Check if journal can transition to a specific teacher status
 */
export function canTransitionToStatus(
  currentStatus: TeacherStatus,
  newStatus: TeacherStatus,
  userRole: string
): { allowed: boolean; reason?: string } {
  // UPLOADED -> ACCEPTED (PI accepts)
  if (currentStatus === TeacherStatus.UPLOADED && newStatus === TeacherStatus.ACCEPTED) {
    return { allowed: true }
  }

  // UPLOADED -> REJECTED (PI rejects)
  if (currentStatus === TeacherStatus.UPLOADED && newStatus === TeacherStatus.REJECTED) {
    return { allowed: true }
  }

  // UPLOADED -> UPDATE (PI requests update)
  if (currentStatus === TeacherStatus.UPLOADED && newStatus === TeacherStatus.UPDATE) {
    return { allowed: true }
  }

  // UPDATE -> UPLOADED (Authors resubmit after update)
  if (currentStatus === TeacherStatus.UPDATE && newStatus === TeacherStatus.UPLOADED) {
    return { allowed: true }
  }

  // ACCEPTED -> PUBLISHED (Editor/Admin publishes)
  if (currentStatus === TeacherStatus.ACCEPTED && newStatus === TeacherStatus.PUBLISHED) {
    if (['EDITOR', 'ADMIN', 'SUPERADMIN'].includes(userRole)) {
      return { allowed: true }
    }
    return { allowed: false, reason: 'Only editors and admins can publish journals' }
  }

  // ACCEPTED -> UPDATE (PI can request update even after acceptance)
  if (currentStatus === TeacherStatus.ACCEPTED && newStatus === TeacherStatus.UPDATE) {
    return { allowed: true }
  }

  // PUBLISHED journals can only be edited by EDITOR/ADMIN/SUPERADMIN
  if (currentStatus === TeacherStatus.PUBLISHED) {
    if (['EDITOR', 'ADMIN', 'SUPERADMIN'].includes(userRole)) {
      return { allowed: true }
    }
    return { allowed: false, reason: 'Published journals can only be modified by editors and admins' }
  }

  return { allowed: false, reason: 'Invalid status transition' }
}

/**
 * Validate journal data before status change
 */
export function validateJournalForStatus(
  journal: Journal,
  targetStatus: TeacherStatus
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // For PUBLISHED status, ensure all required fields are present
  if (targetStatus === TeacherStatus.PUBLISHED) {
    if (!journal.doi) errors.push('DOI is required before publishing')
    if (!journal.publicationDate) errors.push('Publication date is required before publishing')
    if (!journal.abstract) errors.push('Abstract is required before publishing')
    if (journal.keywords.length < 3) errors.push('At least 3 keywords are required before publishing')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ─── Query Helpers ───────────────────────────────────────────────────────────

/**
 * Get journals query filter based on user role and ID
 * Returns where clause for prisma query
 */
export function getJournalQueryFilter(userId: string, userRole: string) {
  // EDITOR, ADMIN, SUPERADMIN can see all journals
  if (['EDITOR', 'ADMIN', 'SUPERADMIN'].includes(userRole)) {
    return {}
  }

  // FACULTY can see all journals
  if (userRole === 'FACULTY') {
    return {}
  }

  // STUDENTS can only see:
  // 1. Public journals
  // 2. Journals they are authors of
  if (userRole === 'STUDENT') {
    return {
      OR: [
        { isPublic: true },
        { studentAuthors: { some: { userId } } },
        { facultyAuthors: { some: { userId } } }, // In case student is somehow faculty author
      ],
    }
  }

  // Default: only public
  return { isPublic: true }
}

/**
 * Get journal by ID with all author relations
 */
export async function getJournalWithAuthors(journalId: string): Promise<JournalWithAuthors | null> {
  return await prisma.journal.findUnique({
    where: { id: journalId },
    include: {
      facultyAuthors: {
        include: {
          user: true,
        },
      },
      studentAuthors: {
        include: {
          user: true,
        },
      },
    },
  })
}

/**
 * Generate unique serial number for journal
 */
export async function generateJournalSerialNo(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `JRN-${year}-`

  // Get the latest journal for this year
  const latestJournal = await prisma.journal.findFirst({
    where: {
      serialNo: {
        startsWith: prefix,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (!latestJournal) {
    return `${prefix}0001`
  }

  // Extract number from serial
  const match = latestJournal.serialNo.match(/\d+$/)
  if (!match) {
    return `${prefix}0001`
  }

  const nextNumber = parseInt(match[0]) + 1
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`
}

// ─── Notification Helpers ────────────────────────────────────────────────────

export interface JournalNotificationData {
  journalId: string
  journalTitle: string
  actionType: 'submitted' | 'accepted' | 'rejected' | 'update_requested' | 'published'
  actorName: string
  message?: string
}

/**
 * Get user IDs who should receive notifications for a journal action
 */
export function getNotificationRecipients(
  journal: JournalWithAuthors,
  actionType: JournalNotificationData['actionType'],
  actorId: string
): string[] {
  const recipients: Set<string> = new Set()

  switch (actionType) {
    case 'submitted':
      // Notify PI
      const pi = getPI(journal)
      if (pi?.userId && pi.userId !== actorId) {
        recipients.add(pi.userId)
      }
      break

    case 'accepted':
    case 'rejected':
    case 'update_requested':
      // Notify all authors except the actor
      journal.facultyAuthors.forEach((author) => {
        if (author.userId && author.userId !== actorId) {
          recipients.add(author.userId)
        }
      })
      journal.studentAuthors.forEach((author) => {
        if (author.userId !== actorId) {
          recipients.add(author.userId)
        }
      })
      break

    case 'published':
      // Notify all authors
      journal.facultyAuthors.forEach((author) => {
        if (author.userId && author.userId !== actorId) {
          recipients.add(author.userId)
        }
      })
      journal.studentAuthors.forEach((author) => {
        if (author.userId !== actorId) {
          recipients.add(author.userId)
        }
      })
      break
  }

  return Array.from(recipients)
}

/**
 * Create notification message based on action type
 */
export function createNotificationMessage(data: JournalNotificationData): {
  title: string
  message: string
  type: string
  link: string
} {
  const baseLink = `/dashboard/journal`

  switch (data.actionType) {
    case 'submitted':
      return {
        title: 'New Journal Submission',
        message: `${data.actorName} has submitted a journal "${data.journalTitle}" for your review.`,
        type: 'journal_submitted',
        link: baseLink,
      }

    case 'accepted':
      return {
        title: 'Journal Accepted',
        message: `${data.actorName} has accepted the journal "${data.journalTitle}". It is now ready for publishing.`,
        type: 'journal_accepted',
        link: baseLink,
      }

    case 'rejected':
      return {
        title: 'Journal Rejected',
        message: `${data.actorName} has rejected the journal "${data.journalTitle}". ${data.message || ''}`,
        type: 'journal_rejected',
        link: baseLink,
      }

    case 'update_requested':
      return {
        title: 'Journal Update Required',
        message: `${data.actorName} has requested updates to the journal "${data.journalTitle}". ${data.message || ''}`,
        type: 'journal_update_requested',
        link: baseLink,
      }

    case 'published':
      return {
        title: 'Journal Published',
        message: `Congratulations! The journal "${data.journalTitle}" has been published by ${data.actorName}.`,
        type: 'journal_published',
        link: baseLink,
      }

    default:
      return {
        title: 'Journal Update',
        message: `The journal "${data.journalTitle}" has been updated.`,
        type: 'journal_update',
        link: baseLink,
      }
  }
}
