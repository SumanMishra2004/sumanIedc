/**
 * @file notifications.ts
 * @description Centralized notification service.
 *
 * All in-app notifications must go through this module so:
 *  1. Notification format is consistent.
 *  2. Duplicate notifications for the same event can be detected.
 *  3. Failures never break the primary operation (fire-and-forget).
 *
 * Usage:
 *   await notify.researchSubmitted({ resourceId, resourceType, title, authorIds })
 *   await notify.researchApproved(...)
 *   await notify.grantApproved(...)
 */

import prisma from '@/lib/prisma'

// ─── Notification type constants ──────────────────────────────────────────────

export const NotifType = {
  // Research
  RESEARCH_SUBMITTED:             'RESEARCH_SUBMITTED',
  RESEARCH_REVIEW_STARTED:        'RESEARCH_REVIEW_STARTED',
  RESEARCH_UPDATE_REQUESTED:      'RESEARCH_UPDATE_REQUESTED',
  RESEARCH_APPROVED:              'RESEARCH_APPROVED',
  RESEARCH_REJECTED:              'RESEARCH_REJECTED',
  RESEARCH_PUBLISHED:             'RESEARCH_PUBLISHED',
  // Faculty verification
  FACULTY_VERIFICATION_REQUESTED: 'FACULTY_VERIFICATION_REQUESTED',
  FACULTY_VERIFICATION_ACCEPTED:  'FACULTY_VERIFICATION_ACCEPTED',
  FACULTY_VERIFICATION_REJECTED:  'FACULTY_VERIFICATION_REJECTED',
  // Grant
  GRANT_SUBMITTED:                'GRANT_SUBMITTED',
  GRANT_APPROVED:                 'GRANT_APPROVED',
  GRANT_REJECTED:                 'GRANT_REJECTED',
  GRANT_TEAM_MEMBER_ADDED:        'GRANT_TEAM_MEMBER_ADDED',
  GRANT_COMPLETED:                'GRANT_COMPLETED',
  GRANT_MAPPING_CREATED:          'GRANT_MAPPING_CREATED',
  // Bills
  BILL_SUBMITTED:                 'BILL_SUBMITTED',
  BILL_ACCEPTED:                  'BILL_ACCEPTED',
  BILL_REJECTED:                  'BILL_REJECTED',
  BILL_PAID:                      'BILL_PAID',
  // Achievements
  ACHIEVEMENT_SUBMITTED:          'ACHIEVEMENT_SUBMITTED',
  ACHIEVEMENT_APPROVED:           'ACHIEVEMENT_APPROVED',
  ACHIEVEMENT_REJECTED:           'ACHIEVEMENT_REJECTED',
  ACHIEVEMENT_UPDATE_REQUESTED:   'ACHIEVEMENT_UPDATE_REQUESTED',
  // Events
  EVENT_PUBLISHED:                'EVENT_PUBLISHED',
  EVENT_CANCELLED:                'EVENT_CANCELLED',
} as const

export type NotifTypeKey = (typeof NotifType)[keyof typeof NotifType]

// ─── Core create function ─────────────────────────────────────────────────────

interface CreateNotifParams {
  userId:  string
  title:   string
  message: string
  type:    string
  link?:   string | null
}

/**
 * Creates a single in-app notification. Never throws.
 */
export async function createNotification(params: CreateNotifParams): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId:  params.userId,
        title:   params.title,
        message: params.message,
        type:    params.type,
        link:    params.link ?? null,
      },
    })
  } catch (err) {
    console.error('[Notification] Failed to create notification for user', params.userId, err)
  }
}

/**
 * Sends the same notification to multiple users. Never throws.
 */
export async function notifyMany(
  userIds: string[],
  params: Omit<CreateNotifParams, 'userId'>,
): Promise<void> {
  const unique = [...new Set(userIds.filter(Boolean))]
  await Promise.allSettled(
    unique.map((userId) => createNotification({ ...params, userId })),
  )
}

// ─── Research notifications ───────────────────────────────────────────────────

const RESOURCE_LABELS: Record<string, string> = {
  journal:      'Journal',
  'book-chapter': 'Book Chapter',
  conference:   'Conference',
  patent:       'Patent',
  copyright:    'Copyright',
}

function researchLabel(resourceType: string): string {
  return RESOURCE_LABELS[resourceType] ?? resourceType
}

function researchLink(resourceType: string, resourceId: string): string {
  return `/dashboard/${resourceType}?id=${resourceId}`
}

/**
 * Notifies all authors when a research record is submitted.
 */
export async function notifyResearchSubmitted(params: {
  resourceType: string
  resourceId:   string
  title:        string
  authorIds:    string[]
  submittedBy:  string
}): Promise<void> {
  const label = researchLabel(params.resourceType)
  const link  = researchLink(params.resourceType, params.resourceId)
  await notifyMany(params.authorIds, {
    title:   `${label} Submitted`,
    message: `${params.submittedBy} submitted a new ${label}: "${params.title}"`,
    type:    NotifType.RESEARCH_SUBMITTED,
    link,
  })
}

/**
 * Notifies authors when review starts.
 */
export async function notifyResearchReviewStarted(params: {
  resourceType: string
  resourceId:   string
  title:        string
  authorIds:    string[]
}): Promise<void> {
  const label = researchLabel(params.resourceType)
  await notifyMany(params.authorIds, {
    title:   `${label} Under Review`,
    message: `Your ${label} "${params.title}" is now under editorial review.`,
    type:    NotifType.RESEARCH_REVIEW_STARTED,
    link:    researchLink(params.resourceType, params.resourceId),
  })
}

/**
 * Notifies authors when a revision is requested.
 */
export async function notifyResearchUpdateRequested(params: {
  resourceType:  string
  resourceId:    string
  title:         string
  authorIds:     string[]
  updateComment: string
}): Promise<void> {
  const label = researchLabel(params.resourceType)
  await notifyMany(params.authorIds, {
    title:   `Revision Requested — ${label}`,
    message: `Revisions requested for your ${label} "${params.title}". Reason: ${params.updateComment}`,
    type:    NotifType.RESEARCH_UPDATE_REQUESTED,
    link:    researchLink(params.resourceType, params.resourceId),
  })
}

/**
 * Notifies authors + admin when research is approved.
 */
export async function notifyResearchApproved(params: {
  resourceType: string
  resourceId:   string
  title:        string
  authorIds:    string[]
  adminIds:     string[]
}): Promise<void> {
  const label = researchLabel(params.resourceType)
  const link  = researchLink(params.resourceType, params.resourceId)

  await notifyMany(params.authorIds, {
    title:   `${label} Approved`,
    message: `Your ${label} "${params.title}" has been approved and is ready for publication.`,
    type:    NotifType.RESEARCH_APPROVED,
    link,
  })

  await notifyMany(params.adminIds, {
    title:   `${label} Ready for Publication`,
    message: `"${params.title}" has been approved by the reviewer.`,
    type:    NotifType.RESEARCH_APPROVED,
    link,
  })
}

/**
 * Notifies authors when research is rejected.
 */
export async function notifyResearchRejected(params: {
  resourceType: string
  resourceId:   string
  title:        string
  authorIds:    string[]
  reason?:      string
}): Promise<void> {
  const label = researchLabel(params.resourceType)
  await notifyMany(params.authorIds, {
    title:   `${label} Rejected`,
    message: `Your ${label} "${params.title}" was rejected.${params.reason ? ` Reason: ${params.reason}` : ''}`,
    type:    NotifType.RESEARCH_REJECTED,
    link:    researchLink(params.resourceType, params.resourceId),
  })
}

/**
 * Notifies all authors when research is published.
 */
export async function notifyResearchPublished(params: {
  resourceType: string
  resourceId:   string
  title:        string
  authorIds:    string[]
}): Promise<void> {
  const label = researchLabel(params.resourceType)
  await notifyMany(params.authorIds, {
    title:   `${label} Published! 🎉`,
    message: `Your ${label} "${params.title}" has been published and is now publicly visible.`,
    type:    NotifType.RESEARCH_PUBLISHED,
    link:    researchLink(params.resourceType, params.resourceId),
  })
}

// ─── Faculty verification notifications ──────────────────────────────────────

export async function notifyFacultyVerificationRequested(params: {
  facultyUserId?: string | null
  facultyName:    string
  researchType:   string
  requestedById:  string
}): Promise<void> {
  if (params.facultyUserId) {
    await createNotification({
      userId:  params.facultyUserId,
      title:   'Co-Author Verification Request',
      message: `A student has listed you as a co-author on a ${params.researchType.toLowerCase().replace('_', ' ')}. Please verify.`,
      type:    NotifType.FACULTY_VERIFICATION_REQUESTED,
      link:    '/dashboard/faculty/verification-requests',
    })
  }
}

export async function notifyFacultyVerificationAccepted(params: {
  requestedById: string
  facultyName:   string
  researchType:  string
}): Promise<void> {
  await createNotification({
    userId:  params.requestedById,
    title:   'Co-Author Verified',
    message: `${params.facultyName} accepted your co-author request for the ${params.researchType} submission.`,
    type:    NotifType.FACULTY_VERIFICATION_ACCEPTED,
    link:    '/dashboard/faculty-verification',
  })
}

export async function notifyFacultyVerificationRejected(params: {
  requestedById: string
  facultyName:   string
  researchType:  string
  reason?:       string
}): Promise<void> {
  await createNotification({
    userId:  params.requestedById,
    title:   'Co-Author Verification Rejected',
    message: `${params.facultyName} rejected your co-author request for the ${params.researchType} submission.${params.reason ? ` Reason: ${params.reason}` : ''}`,
    type:    NotifType.FACULTY_VERIFICATION_REJECTED,
    link:    '/dashboard/faculty-verification',
  })
}

// ─── Grant notifications ──────────────────────────────────────────────────────

export async function notifyGrantSubmitted(params: {
  grantId:      string
  projectCode:  string
  authorIds:    string[]
  adminIds:     string[]
}): Promise<void> {
  const link = `/dashboard/grant/${params.grantId}`
  await notifyMany(params.authorIds, {
    title:   'Grant Application Submitted',
    message: `Grant application for project "${params.projectCode}" has been submitted.`,
    type:    NotifType.GRANT_SUBMITTED,
    link,
  })
  await notifyMany(params.adminIds, {
    title:   'New Grant Application',
    message: `A new grant application (${params.projectCode}) requires review.`,
    type:    NotifType.GRANT_SUBMITTED,
    link,
  })
}

export async function notifyGrantApproved(params: {
  grantId:     string
  projectCode: string
  authorIds:   string[]
}): Promise<void> {
  await notifyMany(params.authorIds, {
    title:   'Grant Approved! 🎉',
    message: `Grant "${params.projectCode}" has been approved.`,
    type:    NotifType.GRANT_APPROVED,
    link:    `/dashboard/grant/${params.grantId}`,
  })
}

export async function notifyGrantRejected(params: {
  grantId:     string
  projectCode: string
  authorIds:   string[]
  reason?:     string
}): Promise<void> {
  await notifyMany(params.authorIds, {
    title:   'Grant Application Rejected',
    message: `Grant application "${params.projectCode}" was rejected.${params.reason ? ` Reason: ${params.reason}` : ''}`,
    type:    NotifType.GRANT_REJECTED,
    link:    `/dashboard/grant/${params.grantId}`,
  })
}

export async function notifyGrantCompleted(params: {
  grantId:     string
  projectCode: string
  authorIds:   string[]
}): Promise<void> {
  await notifyMany(params.authorIds, {
    title:   'Grant Completed',
    message: `Grant project "${params.projectCode}" has been marked as completed.`,
    type:    NotifType.GRANT_COMPLETED,
    link:    `/dashboard/grant/${params.grantId}`,
  })
}

export async function notifyGrantTeamMemberAdded(params: {
  grantId:     string
  projectCode: string
  newMemberId: string
  role:        string
}): Promise<void> {
  await createNotification({
    userId:  params.newMemberId,
    title:   'Added to Grant Project',
    message: `You have been added to grant project "${params.projectCode}" as ${params.role}.`,
    type:    NotifType.GRANT_TEAM_MEMBER_ADDED,
    link:    `/dashboard/grant/${params.grantId}`,
  })
}

// ─── Bill notifications ───────────────────────────────────────────────────────

export async function notifyBillSubmitted(params: {
  grantId:      string
  projectCode:  string
  submitterId:  string
  submitterName: string
  piIds:        string[]
  adminIds:     string[]
  amount?:      number | null
}): Promise<void> {
  const link        = `/dashboard/grant/${params.grantId}`
  const amountStr   = params.amount != null ? ` (₹${params.amount.toLocaleString('en-IN')})` : ''

  await notifyMany(params.piIds, {
    title:   'New Bill Pending Review',
    message: `${params.submitterName} submitted a bill${amountStr} for project "${params.projectCode}". Please review.`,
    type:    NotifType.BILL_SUBMITTED,
    link,
  })
  await notifyMany(params.adminIds, {
    title:   'New Bill Submitted',
    message: `A bill${amountStr} was submitted for project "${params.projectCode}".`,
    type:    NotifType.BILL_SUBMITTED,
    link,
  })
}

export async function notifyBillAccepted(params: {
  grantId:      string
  projectCode:  string
  submitterId:  string
  amount?:      number | null
  adminIds:     string[]
}): Promise<void> {
  const link      = `/dashboard/grant/${params.grantId}`
  const amountStr = params.amount != null ? ` (₹${params.amount.toLocaleString('en-IN')})` : ''

  await createNotification({
    userId:  params.submitterId,
    title:   'Bill Approved',
    message: `Your bill${amountStr} for project "${params.projectCode}" was approved and is awaiting payment.`,
    type:    NotifType.BILL_ACCEPTED,
    link,
  })
  await notifyMany(params.adminIds, {
    title:   'Bill Ready for Payment',
    message: `A bill${amountStr} for project "${params.projectCode}" has been approved and needs disbursement.`,
    type:    NotifType.BILL_ACCEPTED,
    link,
  })
}

export async function notifyBillRejected(params: {
  grantId:      string
  projectCode:  string
  submitterId:  string
  amount?:      number | null
  reason?:      string
}): Promise<void> {
  const amountStr = params.amount != null ? ` (₹${params.amount.toLocaleString('en-IN')})` : ''
  await createNotification({
    userId:  params.submitterId,
    title:   'Bill Rejected',
    message: `Your bill${amountStr} for project "${params.projectCode}" was rejected.${params.reason ? ` Reason: ${params.reason}` : ''}`,
    type:    NotifType.BILL_REJECTED,
    link:    `/dashboard/grant/${params.grantId}`,
  })
}

export async function notifyBillPaid(params: {
  grantId:     string
  projectCode: string
  submitterId: string
  amount?:     number | null
}): Promise<void> {
  const amountStr = params.amount != null ? ` (₹${params.amount.toLocaleString('en-IN')})` : ''
  await createNotification({
    userId:  params.submitterId,
    title:   'Payment Disbursed',
    message: `Your bill${amountStr} for project "${params.projectCode}" has been paid.`,
    type:    NotifType.BILL_PAID,
    link:    `/dashboard/grant/${params.grantId}`,
  })
}

// ─── Achievement notifications ────────────────────────────────────────────────

export async function notifyAchievementSubmitted(params: {
  achievementId: string
  title:         string
  userId:        string
  editorIds:     string[]
}): Promise<void> {
  await createNotification({
    userId:  params.userId,
    title:   'Achievement Submitted',
    message: `Your achievement "${params.title}" has been submitted for review.`,
    type:    NotifType.ACHIEVEMENT_SUBMITTED,
    link:    '/dashboard/achievements',
  })
  await notifyMany(params.editorIds, {
    title:   'New Achievement Submission',
    message: `A new achievement submission "${params.title}" requires review.`,
    type:    NotifType.ACHIEVEMENT_SUBMITTED,
    link:    `/dashboard/admin/achievements/${params.achievementId}`,
  })
}

export async function notifyAchievementApproved(params: {
  achievementId: string
  title:         string
  userId:        string
}): Promise<void> {
  await createNotification({
    userId:  params.userId,
    title:   'Achievement Approved! 🎉',
    message: `Your achievement "${params.title}" has been approved and is now public.`,
    type:    NotifType.ACHIEVEMENT_APPROVED,
    link:    '/dashboard/achievements',
  })
}

export async function notifyAchievementRejected(params: {
  achievementId: string
  title:         string
  userId:        string
  reason?:       string
}): Promise<void> {
  await createNotification({
    userId:  params.userId,
    title:   'Achievement Rejected',
    message: `Your achievement "${params.title}" was not approved.${params.reason ? ` Reason: ${params.reason}` : ''}`,
    type:    NotifType.ACHIEVEMENT_REJECTED,
    link:    '/dashboard/achievements',
  })
}

export async function notifyAchievementUpdateRequested(params: {
  achievementId: string
  title:         string
  userId:        string
  updateComment: string
}): Promise<void> {
  await createNotification({
    userId:  params.userId,
    title:   'Achievement Revision Requested',
    message: `Revisions requested for your achievement "${params.title}". Reason: ${params.updateComment}`,
    type:    NotifType.ACHIEVEMENT_UPDATE_REQUESTED,
    link:    '/dashboard/achievements',
  })
}
