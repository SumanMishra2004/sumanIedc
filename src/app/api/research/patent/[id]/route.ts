/**
 * GET  /api/research/patent/[id]
 * PATCH /api/research/patent/[id]
 * DELETE /api/research/patent/[id]
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
import { TeacherStatus, PatentStatus, UserRole } from '@prisma/client'
import { broadcastPublicationEmail } from '@/lib/mail'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const patent = await prisma.patent.findUnique({
      where: { id },
      include: {
        studentAuthors: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
        facultyAuthors: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
      },
    })
    if (!patent) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (patent.isPublic && patent.patentStatus === PatentStatus.GRANTED) {
      return NextResponse.json({ patent })
    }

    const guard = await requireAuth(req)
    if (!guard.ok) return guard.response
    const { session } = guard

    if (!canViewAllResearch(session.user.role)) {
      if (!canReadResearch(session.user, { studentAuthors: patent.studentAuthors, facultyAuthors: patent.facultyAuthors })) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    }
    return NextResponse.json({ patent })
  } catch (error) {
    console.error('[Patent GET]', error)
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

    const existing = await prisma.patent.findUnique({
      where: { id }, include: { studentAuthors: true, facultyAuthors: true },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!canWriteResearch(session.user, existing)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (role === UserRole.STUDENT) {
      if (isLockedForStudent(existing.teacherStatus, existing.patentStatus === PatentStatus.GRANTED)) {
        return NextResponse.json({ error: 'This patent is locked and cannot be edited at this stage' }, { status: 403 })
      }
    }

    const allowlist = getResearchUpdateAllowlist('patent', role)
    const safeBody  = pickAllowedFields(body, allowlist) as Record<string, unknown>
    const wantsStu  = Array.isArray(body.studentAuthorIds)
    const wantsFac  = Array.isArray(body.facultyAuthorIds)

    const newTeacher = safeBody.teacherStatus as TeacherStatus | undefined
    const newStatus  = safeBody.patentStatus as PatentStatus | undefined

    const sr = validateResearchStatusChange(role, 'patent', existing.teacherStatus, existing.patentStatus, newTeacher, newStatus)
    if (sr.error) return sr.error

    if (role === UserRole.STUDENT && existing.teacherStatus === TeacherStatus.UPDATE) {
      safeBody.teacherStatus = TeacherStatus.UPLOADED
      safeBody.updateComment = null
    }
    if (sr.impliedMainStatus) safeBody.patentStatus = sr.impliedMainStatus

    const resolvedStatus = (safeBody.patentStatus ?? existing.patentStatus) as PatentStatus
    if (resolvedStatus === PatentStatus.GRANTED) {
      if (!canPublishContent(role)) return NextResponse.json({ error: 'Forbidden — only EDITOR or higher can grant patents' }, { status: 403 })
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
    const dateFlds = ['filingDate','submissionDate','publicationDate','grantDate'] as const
    for (const f of dateFlds) {
      if (safeBody[f] !== undefined) updateData[f] = safeBody[f] ? new Date(safeBody[f] as string) : null
    }

    if (wantsStu) {
      await prisma.patentStudentAuthor.deleteMany({ where: { patentId: id } })
      updateData.studentAuthors = { create: (body.studentAuthorIds as string[]).map((uId) => ({ userId: uId })) }
    }
    if (wantsFac) {
      await prisma.patentTeacherAuthor.deleteMany({ where: { patentId: id } })
      updateData.facultyAuthors = { create: (body.facultyAuthorIds as string[]).map((uId) => ({ userId: uId, verificationStatus: 'ACCEPTED' })) }
    }

    const patent = await prisma.patent.update({
      where: { id }, data: updateData,
      include: {
        studentAuthors: { include: { user: { select: { id: true, name: true, email: true } } } },
        facultyAuthors: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    })

    const rT = (updateData.teacherStatus ?? existing.teacherStatus) as TeacherStatus
    const rP = (updateData.patentStatus ?? existing.patentStatus) as PatentStatus
    if (rT !== existing.teacherStatus || rP !== existing.patentStatus) {
      await auditResearchChange({
        session: session as { user: { id: string; email: string; role: string } },
        resourceType: 'Patent', resourceId: id,
        oldStatus: `${existing.teacherStatus}/${existing.patentStatus}`,
        newStatus: `${rT}/${rP}`,
        action: rP === PatentStatus.GRANTED ? AuditActions.RESEARCH_PUBLISHED : AuditActions.RESEARCH_APPROVED,
        ipAddress: ip,
      })
    }

    const authorIds = allAuthorUserIds(patent.studentAuthors, patent.facultyAuthors)
    await dispatchResearchStatusNotifications({
      resourceType: 'patent', resourceId: id, title: patent.title,
      oldTeacherStatus: existing.teacherStatus, newTeacherStatus: updateData.teacherStatus as TeacherStatus | undefined,
      oldMainStatus: existing.patentStatus, newMainStatus: updateData.patentStatus as string | undefined,
      updateComment: updateData.updateComment as string | null | undefined,
      allAuthorIds: authorIds, sessionUserId: userId, sessionRole: role,
    })

    if (rP === PatentStatus.GRANTED) {
      broadcastPublicationEmail({
        resourceType: 'patent', resourceTitle: patent.title, resourceId: id,
        authors: [...patent.studentAuthors.map(sa => sa.user.name), ...patent.facultyAuthors.map(fa => fa.user?.name)].filter(Boolean) as string[],
        excludeUserIds: authorIds,
      }).catch(() => {})
    }

    return NextResponse.json({ patent })
  } catch (error) {
    console.error('[Patent PATCH]', error)
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

    if (role === UserRole.STUDENT) return NextResponse.json({ error: 'Forbidden — students cannot delete patents' }, { status: 403 })

    const patent = await prisma.patent.findUnique({ where: { id }, include: { facultyAuthors: true } })
    if (!patent) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (role === UserRole.FACULTY) {
      if (!patent.facultyAuthors.some((fa) => fa.userId === userId)) {
        return NextResponse.json({ error: 'Forbidden — you can only delete patents you author' }, { status: 403 })
      }
    }

    await prisma.patent.delete({ where: { id } })
    return NextResponse.json({ message: 'Patent deleted successfully' })
  } catch (error) {
    console.error('[Patent DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
