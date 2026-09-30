/**
 * GET  /api/research/conference/[id]
 * PATCH /api/research/conference/[id]
 * DELETE /api/research/conference/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, getClientIp } from '@/lib/auth/guard'
import { canViewAllResearch, canPublishContent } from '@/lib/auth/permissions'
import { pickAllowedFields, getResearchUpdateAllowlist } from '@/lib/auth/field-allowlists'
import { AuditActions } from '@/lib/audit'
import {
  canReadResearch, canWriteResearch, isLockedForStudent,
  validateResearchStatusChange, dispatchResearchStatusNotifications,
  auditResearchChange, allAuthorUserIds,
} from '@/lib/research/researchRouteHelpers'
import { TeacherStatus, ConferenceStatus, UserRole } from '@prisma/client'
import { broadcastPublicationEmail } from '@/lib/mail'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const conference = await prisma.conference.findUnique({
      where: { id },
      include: {
        studentAuthors: { include: { user: { select: { id: true, name: true, email: true, image: true, department: true } } } },
        facultyAuthors: { include: { user: { select: { id: true, name: true, email: true, image: true, department: true } } } },
      },
    })
    if (!conference) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (conference.isPublic && conference.conferenceStatus === ConferenceStatus.PUBLISHED) {
      return NextResponse.json({ conference })
    }

    const guard = await requireAuth(req)
    if (!guard.ok) return guard.response
    const { session } = guard

    if (!canViewAllResearch(session.user.role)) {
      if (!canReadResearch(session.user, { studentAuthors: conference.studentAuthors, facultyAuthors: conference.facultyAuthors })) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    }
    return NextResponse.json({ conference })
  } catch (error) {
    console.error('[Conference GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await requireAuth(req)
    if (!guard.ok) return guard.response
    const { session } = guard
    const { id } = await params
    const body = await req.json()
    const { role, id: userId } = session.user
    const ip = await getClientIp(req)

    const existing = await prisma.conference.findUnique({
      where: { id }, include: { studentAuthors: true, facultyAuthors: true },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!canWriteResearch(session.user, existing)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (role === UserRole.STUDENT) {
      if (isLockedForStudent(existing.teacherStatus, existing.conferenceStatus === ConferenceStatus.PUBLISHED)) {
        return NextResponse.json({ error: 'This conference is locked and cannot be edited at this stage' }, { status: 403 })
      }
    }

    const allowlist = getResearchUpdateAllowlist('conference', role)
    const safeBody  = pickAllowedFields(body, allowlist) as Record<string, unknown>
    const wantsStu  = Array.isArray(body.studentAuthorIds)
    const wantsFac  = Array.isArray(body.facultyAuthorIds)

    const newTeacher = safeBody.teacherStatus as TeacherStatus | undefined
    const newStatus  = safeBody.conferenceStatus as ConferenceStatus | undefined

    const sr = validateResearchStatusChange(role, 'conference', existing.teacherStatus, existing.conferenceStatus, newTeacher, newStatus)
    if (sr.error) return sr.error

    if (role === UserRole.STUDENT && existing.teacherStatus === TeacherStatus.UPDATE) {
      safeBody.teacherStatus = TeacherStatus.UPLOADED
      safeBody.updateComment = null
    }
    if (sr.impliedMainStatus) safeBody.conferenceStatus = sr.impliedMainStatus

    const resolvedStatus = (safeBody.conferenceStatus ?? existing.conferenceStatus) as ConferenceStatus
    if (resolvedStatus === ConferenceStatus.PUBLISHED) {
      if (!canPublishContent(role)) return NextResponse.json({ error: 'Forbidden — only EDITOR or higher can publish' }, { status: 403 })
      safeBody.isPublic = true
      safeBody.teacherStatus = TeacherStatus.PUBLISHED
    }

    if (wantsStu) {
      const sIds: string[] = body.studentAuthorIds
      const valid = await prisma.user.findMany({ where: { id: { in: sIds }, role: UserRole.STUDENT } })
      if (valid.length !== sIds.length) return NextResponse.json({ error: 'One or more student authors are invalid' }, { status: 400 })
      if (role === UserRole.STUDENT && !sIds.includes(userId)) return NextResponse.json({ error: 'You must remain listed as an author' }, { status: 400 })
    }
    if (wantsFac) {
      const fIds: string[] = body.facultyAuthorIds
      const valid = await prisma.user.findMany({ where: { id: { in: fIds }, role: { in: ['FACULTY','EDITOR','ADMIN','SUPERADMIN'] as UserRole[] } } })
      if (valid.length !== fIds.length) return NextResponse.json({ error: 'One or more faculty authors are invalid' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { ...safeBody }
    if (safeBody.conferenceDate !== undefined) updateData.conferenceDate = safeBody.conferenceDate ? new Date(safeBody.conferenceDate as string) : null
    if (safeBody.statusDate !== undefined) updateData.statusDate = safeBody.statusDate ? new Date(safeBody.statusDate as string) : null
    if (safeBody.registrationFees !== undefined) updateData.registrationFees = safeBody.registrationFees ? parseFloat(safeBody.registrationFees as string) : null
    if (safeBody.reimbursement !== undefined) updateData.reimbursement = safeBody.reimbursement ? parseFloat(safeBody.reimbursement as string) : null

    if (wantsStu) {
      await prisma.conferenceStudentAuthor.deleteMany({ where: { conferenceId: id } })
      updateData.studentAuthors = { create: (body.studentAuthorIds as string[]).map((uId) => ({ userId: uId })) }
    }
    if (wantsFac) {
      await prisma.conferenceTeacherAuthor.deleteMany({ where: { conferenceId: id } })
      updateData.facultyAuthors = { create: (body.facultyAuthorIds as string[]).map((uId) => ({ userId: uId, verificationStatus: 'ACCEPTED' })) }
    }

    const conference = await prisma.conference.update({
      where: { id }, data: updateData,
      include: {
        studentAuthors: { include: { user: { select: { id: true, name: true, email: true } } } },
        facultyAuthors: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    })

    const rT = (updateData.teacherStatus ?? existing.teacherStatus) as TeacherStatus
    const rM = (updateData.conferenceStatus ?? existing.conferenceStatus) as ConferenceStatus
    if (rT !== existing.teacherStatus || rM !== existing.conferenceStatus) {
      await auditResearchChange({
        session: session as { user: { id: string; email: string; role: string } },
        resourceType: 'Conference', resourceId: id,
        oldStatus: `${existing.teacherStatus}/${existing.conferenceStatus}`,
        newStatus: `${rT}/${rM}`,
        action: rM === ConferenceStatus.PUBLISHED ? AuditActions.RESEARCH_PUBLISHED : AuditActions.RESEARCH_APPROVED,
        ipAddress: ip,
      })
    }

    const authorIds = allAuthorUserIds(conference.studentAuthors, conference.facultyAuthors)
    await dispatchResearchStatusNotifications({
      resourceType: 'conference', resourceId: id, title: conference.conferenceName,
      oldTeacherStatus: existing.teacherStatus, newTeacherStatus: updateData.teacherStatus as TeacherStatus | undefined,
      oldMainStatus: existing.conferenceStatus, newMainStatus: updateData.conferenceStatus as string | undefined,
      updateComment: updateData.updateComment as string | null | undefined,
      allAuthorIds: authorIds, sessionUserId: userId, sessionRole: role,
    })

    if (rM === ConferenceStatus.PUBLISHED) {
      broadcastPublicationEmail({
        resourceType: 'conference', resourceTitle: conference.conferenceName, resourceId: id,
        authors: [...conference.studentAuthors.map(sa => sa.user.name), ...conference.facultyAuthors.map(fa => fa.user?.name)].filter(Boolean) as string[],
        excludeUserIds: authorIds,
      }).catch(() => {})
    }

    return NextResponse.json({ conference })
  } catch (error) {
    console.error('[Conference PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await requireAuth(req)
    if (!guard.ok) return guard.response
    const { session } = guard
    const { role, id: userId } = session.user
    const { id } = await params

    if (role === UserRole.STUDENT) return NextResponse.json({ error: 'Forbidden — students cannot delete conferences' }, { status: 403 })

    const conference = await prisma.conference.findUnique({ where: { id }, include: { facultyAuthors: true } })
    if (!conference) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (role === UserRole.FACULTY) {
      if (!conference.facultyAuthors.some((fa) => fa.userId === userId)) {
        return NextResponse.json({ error: 'Forbidden — you can only delete conferences you author' }, { status: 403 })
      }
    }

    await prisma.conference.delete({ where: { id } })
    return NextResponse.json({ message: 'Conference deleted successfully' })
  } catch (error) {
    console.error('[Conference DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
