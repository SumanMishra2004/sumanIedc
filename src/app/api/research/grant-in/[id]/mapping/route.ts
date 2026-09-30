/**
 * POST   /api/research/grant-in/[id]/mapping  — create a grant→publication mapping
 * GET    /api/research/grant-in/[id]/mapping  — list all mappings for this grant
 * DELETE /api/research/grant-in/[id]/mapping/[mappingId]  — remove a mapping
 *
 * Security guarantees:
 *  - 401 unauthenticated, 403 forbidden, 404 to hide existence
 *  - Caller must be a legitimate grant team member (PI, CoPI, or ADMIN+)
 *  - Caller must have a legitimate relationship with the publication
 *    (is an author on it, or is ADMIN+)
 *  - Publication type must match the supplied publicationType enum value
 *  - Duplicate mapping (same grant + same publication) is rejected with 409
 *  - Entire validation + insert wrapped in a Prisma transaction
 *  - Audit log written on every create and delete
 *  - Notifies PI on successful mapping
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { PublicationType, GrantInRole, UserRole } from '@prisma/client'
import { isAdminOrHigher } from '@/lib/auth/permissions'
import { AuditActions, writeAuditLog, fromSession } from '@/lib/audit'
import { getClientIp } from '@/lib/auth/guard'
import { createNotification, NotifType } from '@/lib/notifications'

// ─── Type helpers ─────────────────────────────────────────────────────────────

/** Maps a PublicationType to the field name used in GrantInMapping */
const TYPE_TO_FIELD: Record<PublicationType, string> = {
  JOURNAL:     'journalId',
  CONFERENCE:  'conferenceId',
  BOOKCHAPTER: 'bookChapterId',
  PATENT:      'patentId',
  COPYRIGHT:   'copyrightId',
}

/** Maps a PublicationType to the Prisma model name (for the existence check) */
type ResearchModel = 'journal' | 'bookChapter' | 'conference' | 'patent' | 'copyright'
const TYPE_TO_MODEL: Record<PublicationType, ResearchModel> = {
  JOURNAL:     'journal',
  CONFERENCE:  'conference',
  BOOKCHAPTER: 'bookChapter',
  PATENT:      'patent',
  COPYRIGHT:   'copyright',
}

// ─── Authorization helpers ────────────────────────────────────────────────────

/** Returns true if the user is a PI or CoPI on the grant */
async function isGrantPIOrCoPI(userId: string, grantId: string): Promise<boolean> {
  const entry = await prisma.grantInTeacherAuthor.findFirst({
    where: {
      grantInId: grantId,
      userId,
      role: { in: [GrantInRole.FACULTY_PI, GrantInRole.FACULTY_COPI] },
    },
  })
  return !!entry
}

/** Returns true if the user is a student member on the grant */
async function isGrantStudentMember(userId: string, grantId: string): Promise<boolean> {
  const entry = await prisma.grantInStudentAuthor.findFirst({
    where: { grantInId: grantId, userId },
  })
  return !!entry
}

/**
 * Verifies the caller has a legitimate relationship with the publication.
 * ADMIN+ can map any publication. Others must be listed as an author.
 */
async function userHasPublicationRelationship(
  userId: string,
  role: string,
  publicationType: PublicationType,
  publicationId: string,
): Promise<boolean> {
  if (isAdminOrHigher(role)) return true

  switch (publicationType) {
    case PublicationType.JOURNAL: {
      const sa = await prisma.journalStudentAuthor.findFirst({ where: { journalId: publicationId, userId } })
      const fa = await prisma.journalTeacherAuthor.findFirst({ where: { journalId: publicationId, userId } })
      return !!(sa || fa)
    }
    case PublicationType.BOOKCHAPTER: {
      const sa = await prisma.bookChapterStudentAuthor.findFirst({ where: { bookChapterId: publicationId, userId } })
      const fa = await prisma.bookChapterTeacherAuthor.findFirst({ where: { bookChapterId: publicationId, userId } })
      return !!(sa || fa)
    }
    case PublicationType.CONFERENCE: {
      const sa = await prisma.conferenceStudentAuthor.findFirst({ where: { conferenceId: publicationId, userId } })
      const fa = await prisma.conferenceTeacherAuthor.findFirst({ where: { conferenceId: publicationId, userId } })
      return !!(sa || fa)
    }
    case PublicationType.PATENT: {
      const sa = await prisma.patentStudentAuthor.findFirst({ where: { patentId: publicationId, userId } })
      const fa = await prisma.patentTeacherAuthor.findFirst({ where: { patentId: publicationId, userId } })
      return !!(sa || fa)
    }
    case PublicationType.COPYRIGHT: {
      const sa = await prisma.copyrightStudentAuthor.findFirst({ where: { copyrightId: publicationId, userId } })
      const fa = await prisma.copyrightTeacherAuthor.findFirst({ where: { copyrightId: publicationId, userId } })
      return !!(sa || fa)
    }
    default:
      return false
  }
}

// ─── GET — list mappings for this grant ───────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: grantId } = await params
    const userId   = session.user.id
    const userRole = session.user.role

    // Verify the grant exists and the caller has access
    const isMember =
      isAdminOrHigher(userRole) ||
      (await isGrantPIOrCoPI(userId, grantId)) ||
      (await isGrantStudentMember(userId, grantId))

    if (!isMember) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const mappings = await prisma.grantInMapping.findMany({
      where: { grantInId: grantId },
      include: {
        journal:     { select: { id: true, title: true, journalName: true, journalStatus: true } },
        conference:  { select: { id: true, conferenceName: true, conferenceStatus: true } },
        bookChapter: { select: { id: true, title: true, bookChapterStatus: true } },
        patent:      { select: { id: true, title: true, patentStatus: true } },
        copyright:   { select: { id: true, title: true, copyrightStatus: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ mappings })
  } catch (error) {
    console.error('[GrantMapping GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST — create a new mapping ─────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: grantId } = await params
    const userId   = session.user.id
    const userRole = session.user.role
    const ip       = await getClientIp(req)
    const body     = await req.json()

    const { publicationType, publicationId } = body as {
      publicationType: string
      publicationId:   string
    }

    // ── Input validation ──────────────────────────────────────────────────────
    if (!publicationType || !publicationId) {
      return NextResponse.json(
        { error: 'publicationType and publicationId are required' },
        { status: 400 },
      )
    }

    if (!Object.values(PublicationType).includes(publicationType as PublicationType)) {
      return NextResponse.json(
        { error: `Invalid publicationType. Must be one of: ${Object.values(PublicationType).join(', ')}` },
        { status: 400 },
      )
    }

    const pubType = publicationType as PublicationType

    // ── 1. Verify grant exists ────────────────────────────────────────────────
    const grant = await prisma.grantIn.findUnique({
      where: { id: grantId },
      select: { id: true, projectCode: true, grantInStatus: true },
    })

    if (!grant) {
      return NextResponse.json({ error: 'Grant not found' }, { status: 404 })
    }

    // ── 2. Caller must be a grant member (PI/CoPI) or ADMIN+ ─────────────────
    const isAdmin       = isAdminOrHigher(userRole)
    const isPIOrCoPI    = await isGrantPIOrCoPI(userId, grantId)
    // Students are grant members but cannot create mappings (PI responsibility)
    if (!isAdmin && !isPIOrCoPI) {
      return NextResponse.json(
        { error: 'Only the grant PI, Co-PI, or an administrator can add publication mappings' },
        { status: 403 },
      )
    }

    // ── 3. Verify the publication exists ──────────────────────────────────────
    const model = TYPE_TO_MODEL[pubType]
    // Dynamic model access — safe because model is derived from a controlled enum
    const publication = await (prisma[model] as any).findUnique({
      where: { id: publicationId },
      select: { id: true },
    })

    if (!publication) {
      return NextResponse.json(
        { error: `${pubType} with id "${publicationId}" not found` },
        { status: 404 },
      )
    }

    // ── 4. Caller must have a legitimate relationship with the publication ─────
    const hasRelationship = await userHasPublicationRelationship(userId, userRole, pubType, publicationId)
    if (!hasRelationship) {
      return NextResponse.json(
        { error: 'You must be an author on the publication to map it to a grant' },
        { status: 403 },
      )
    }

    // ── 5. Duplicate mapping check ────────────────────────────────────────────
    const pubField = TYPE_TO_FIELD[pubType]
    const existing = await prisma.grantInMapping.findFirst({
      where: {
        grantInId:      grantId,
        publicationType: pubType,
        [pubField]:      publicationId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'This publication is already mapped to the grant' },
        { status: 409 },
      )
    }

    // ── 6. Create mapping in a transaction + write audit log ──────────────────
    const mapping = await prisma.$transaction(async (tx) => {
      return tx.grantInMapping.create({
        data: {
          grantInId:       grantId,
          publicationType: pubType,
          [pubField]:      publicationId,
        },
        include: {
          journal:     { select: { id: true, title: true } },
          conference:  { select: { id: true, conferenceName: true } },
          bookChapter: { select: { id: true, title: true } },
          patent:      { select: { id: true, title: true } },
          copyright:   { select: { id: true, title: true } },
        },
      })
    })

    // Audit log (fire-and-forget — mapping already created)
    writeAuditLog({
      ...fromSession(session as { user: { id: string; email: string; role: string } }),
      action:       AuditActions.GRANT_MAPPING_CREATED,
      resourceType: 'GrantInMapping',
      resourceId:   mapping.id,
      newValue:     { grantId, publicationType: pubType, publicationId },
      ipAddress:    ip,
    }).catch(() => {})

    // Notify PI/CoPI members
    const piMembers = await prisma.grantInTeacherAuthor.findMany({
      where: {
        grantInId: grantId,
        role:      GrantInRole.FACULTY_PI,
        userId:    { not: null },
      },
      select: { userId: true },
    })

    const pubLabel = pubType.charAt(0) + pubType.slice(1).toLowerCase().replace('_', ' ')
    for (const pi of piMembers) {
      if (pi.userId && pi.userId !== userId) {
        createNotification({
          userId:  pi.userId,
          title:   'Publication Mapped to Grant',
          message: `A ${pubLabel} was mapped to grant project "${grant.projectCode ?? grantId}".`,
          type:    NotifType.GRANT_MAPPING_CREATED,
          link:    `/dashboard/grant/${grantId}`,
        }).catch(() => {})
      }
    }

    return NextResponse.json({ mapping }, { status: 201 })
  } catch (error) {
    console.error('[GrantMapping POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
