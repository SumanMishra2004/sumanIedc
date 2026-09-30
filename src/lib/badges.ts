/**
 * @file badges.ts
 * @description Badge count queries for sidebar navigation indicators.
 * 
 * Badge keys correspond to NavItem.badge in sidebar config:
 *  - unreadNotifications
 *  - pendingReviews
 *  - pendingBills
 *  - pendingVerifications
 * 
 * SECURITY: These counts are role-filtered. Always pass the authenticated
 * user's role and ID. Never trust client-provided role values.
 */

import prisma from '@/lib/prisma'
import { TeacherStatus, CertificateStatus, FDPStatus, AchievementStatus } from '@prisma/client'
import { type Role } from '@/lib/config/sidebar'

export interface BadgeCounts {
  unreadNotifications?: number
  pendingReviews?: number
  pendingBills?: number
  pendingVerifications?: number
}

/**
 * Fetch all badge counts for the given user role and ID.
 * Returns only the counts relevant to that role.
 */
export async function getBadgeCounts(
  role: Role,
  userId: string
): Promise<BadgeCounts> {
  const counts: BadgeCounts = {}

  // All authenticated users see unread notifications
  counts.unreadNotifications = await getUnreadNotificationCount(userId)

  // FACULTY see pending verification requests directed at them
  if (role === 'FACULTY' || role === 'EDITOR' || role === 'ADMIN' || role === 'SUPERADMIN') {
    counts.pendingVerifications = await getPendingVerificationCount(userId, role)
  }

  // STAFF (EDITOR+) see pending reviews across all research types
  if (role === 'EDITOR' || role === 'ADMIN' || role === 'SUPERADMIN') {
    counts.pendingReviews = await getPendingReviewCount()
  }

  // ADMIN+ see pending bills
  if (role === 'ADMIN' || role === 'SUPERADMIN') {
    counts.pendingBills = await getPendingBillCount()
  }

  return counts
}

/**
 * Count unread notifications for a user.
 * A notification is unread if read = false.
 */
async function getUnreadNotificationCount(userId: string): Promise<number> {
  return await prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  })
}

/**
 * Count pending verification requests.
 * - FACULTY: requests where linkedFacultyId = userId and status = PENDING
 * - STAFF: all PENDING requests (for admin override visibility)
 */
async function getPendingVerificationCount(
  userId: string,
  role: Role
): Promise<number> {
  if (role === 'FACULTY') {
    // Faculty only see requests directed at them
    return await prisma.facultyVerificationRequest.count({
      where: {
        linkedFacultyId: userId,
        status: 'PENDING',
      },
    })
  }

  // STAFF see all pending verifications
  return await prisma.facultyVerificationRequest.count({
    where: {
      status: 'PENDING',
    },
  })
}

/**
 * Count research items pending editorial review.
 * 
 * "Pending review" means:
 *  - teacherStatus = UPLOADED (newly submitted, needs first review)
 *  - OR teacherStatus = UPDATE (author resubmitted after feedback)
 * 
 * This count aggregates across all research types:
 *  - Journals
 *  - Book Chapters
 *  - Conferences
 *  - Patents
 *  - Copyrights
 *  - Certificates
 *  - FDPs
 *  - Achievements (achievementStatus = SUBMITTED | UNDER_REVIEW)
 */
async function getPendingReviewCount(): Promise<number> {
  // Only models that have a teacherStatus field
  const teacherStatusFilter = {
    teacherStatus: {
      in: [TeacherStatus.UPLOADED, TeacherStatus.UPDATE],
    },
  }

  // Separate filters for models without teacherStatus
  const certificateFilter = { certificateStatus: CertificateStatus.SUBMITTED }
  const fdpFilter          = { fdpStatus: FDPStatus.SUBMITTED }

  const [
    journalCount,
    bookChapterCount,
    conferenceCount,
    patentCount,
    copyrightCount,
    certificateCount,
    fdpCount,
    achievementCount,
  ] = await Promise.all([
    prisma.journal.count({ where: teacherStatusFilter }),
    prisma.bookChapter.count({ where: teacherStatusFilter }),
    prisma.conference.count({ where: teacherStatusFilter }),
    prisma.patent.count({ where: teacherStatusFilter }),
    prisma.copyright.count({ where: teacherStatusFilter }),
    prisma.certificate.count({ where: certificateFilter }),
    prisma.fDP.count({ where: fdpFilter }),
    prisma.achievement.count({
      where: {
        achievementStatus: {
          in: [AchievementStatus.SUBMITTED, AchievementStatus.UNDER_REVIEW],
        },
      },
    }),
  ])

  return (
    journalCount +
    bookChapterCount +
    conferenceCount +
    patentCount +
    copyrightCount +
    certificateCount +
    fdpCount +
    achievementCount
  )
}

/**
 * Count bills pending admin action.
 * 
 * "Pending bill" means billStatus = PENDING (not yet reviewed) or SUBMITTED (awaiting payment).
 * Based on the schema, PENDING is the initial state, so we'll check for PENDING.
 */
async function getPendingBillCount(): Promise<number> {
  return await prisma.grantInBill.count({
    where: {
      billStatus: 'PENDING',
    },
  })
}

/**
 * Get a single badge count by key.
 * Useful for on-demand refresh after an action (e.g., marking notification read).
 */
export async function getBadgeCount(
  key: keyof BadgeCounts,
  role: Role,
  userId: string
): Promise<number> {
  switch (key) {
    case 'unreadNotifications':
      return await getUnreadNotificationCount(userId)
    case 'pendingVerifications':
      if (role === 'FACULTY' || role === 'EDITOR' || role === 'ADMIN' || role === 'SUPERADMIN') {
        return await getPendingVerificationCount(userId, role)
      }
      return 0
    case 'pendingReviews':
      if (role === 'EDITOR' || role === 'ADMIN' || role === 'SUPERADMIN') {
        return await getPendingReviewCount()
      }
      return 0
    case 'pendingBills':
      if (role === 'ADMIN' || role === 'SUPERADMIN') {
        return await getPendingBillCount()
      }
      return 0
    default:
      return 0
  }
}
