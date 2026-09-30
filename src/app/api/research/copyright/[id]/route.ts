/**
 * GET  /api/research/copyright/[id]
 * PATCH /api/research/copyright/[id]
 * DELETE /api/research/copyright/[id]
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
import { TeacherStatus, CopyrightStatus, UserRole } from '@prisma/client'
import { broadcastPublicationEmail } from '@/lib/mail'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const copyright = await prisma.copyright.findUnique({
      where: { id },
      include: {
        studentAuthors: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
        facultyAuthors: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
      },
    })
    if (!copyright) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (copyright.isPublic && copyright.copyrightStatus === CopyrightStatus.PUBLISHED) {
      return NextResponse.json({ copyright })
    }

    const guard = await requireAuth(req)
    if (!guard.ok) return guard.response
    const { session } = guard

    if (!canViewAllResearch(session.user.role)) {
      if (!canReadResearch(session.user, { studentAuthors: copyright.studentAuthors, facultyAuthors: copyright.facultyAuthors })) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    }
    return NextResponse.json({ copyright })
  } catch (error) {
    console.error('[Copyright GET]', error)
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

    const existing = await prisma.copyright.findUnique({
      where: { id }, include: { studentAuthors: true, facultyAuthors: true },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!canWriteResearch(session.user, existing)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (role === UserRole.STUDENT) {
      if (isLockedForStudent(existing.teacherStatus, existing.copyrightStatus === CopyrightStatus.PUBLISHED)) {
        return NextResponse.json({ error: 'This copyright is locked and cannot be edited at this stage' }, { status: 403 })
      }
    }

    const allowlist = getResearchUpdateAllowlist('copyright', role)
    const safeBody  = pickAllowedFields(body, allowlist) as Record<string, unknown>
    const wantsStu  = Array.isArray(body.studentAuthorIds)
    const wantsFac  = Array.isArray(body.facultyAuthorIds)

    const newTeacher = safeBody.teacherStatus as TeacherStatus | undefined
    const newStatus  = safeBody.copyrightStatus as CopyrightStatus | undefined

    const sr = validateResearchStatusChange(role, 'copyright', existing.teacherStatus, existing.copyrightStatus, newTeacher, newStatus)
    if (sr.error) return sr.error

    if (role === UserRole.STUDENT && existing.teacherStatus === TeacherStatus.UPDATE) {
      safeBody.teacherStatus = TeacherStatus.UPLOADED
      safeBody.updateComment = null
    }
    if (sr.impliedMainStatus) safeBody.copyrightStatus = sr.impliedMainStatus

    const resolvedStatus = (safeBody.copyrightStatus ?? existing.copyrightStatus) as CopyrightStatus
    if (resolvedStatus === CopyrightStatus.PUBLISHED) {
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
    const dateFlds = ['dateOfFiling','dateOfSubmission','dateOfPublished','dateOfGrant'] as const
    for (const f of dateFlds) {
      if (safeBody[f] !== undefined) updateData[f] = safeBody[f] ? new Date(safeBody[f] as string) : null
    }
    if (safeBody.registrationFees !== undefined) updateData.registrationFees = safeBody.registrationFees ? parseFloat(safeBody.registrationFees as string) : null
    if (safeBody.reimbursement !== undefined) updateData.reimbursement = safeBody.reimbursement ? parseFloat(safeBody.reimbursement as string) : null

    if (wantsStu) {
      await prisma.copyrightStudentAuthor.deleteMany({ where: { copyrightId: id } })
      updateData.studentAuthors = { create: (body.studentAuthorIds as string[]).map((uId) => ({ userId: uId })) }
    }
    if (wantsFac) {
      await prisma.copyrightTeacherAuthor.deleteMany({ where: { copyrightId: id } })
      updateData.facultyAuthors = { create: (body.facultyAuthorIds as string[]).map((uId) => ({ userId: uId, verificationStatus: 'ACCEPTED' })) }
    }

    const copyright = await prisma.copyright.update({
      where: { id }, data: updateData,
      include: {
        studentAuthors: { include: { user: { select: { id: true, name: true, email: true } } } },
        facultyAuthors: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    })

    const rT = (updateData.teacherStatus ?? existing.teacherStatus) as TeacherStatus
    const rC = (updateData.copyrightStatus ?? existing.copyrightStatus) as CopyrightStatus
    if (rT !== existing.teacherStatus || rC !== existing.copyrightStatus) {
      await auditResearchChange({
        session: session as { user: { id: string; email: string; role: string } },
        resourceType: 'Copyright', resourceId: id,
        oldStatus: `${existing.teacherStatus}/${existing.copyrightStatus}`,
        newStatus: `${rT}/${rC}`,
        action: rC === CopyrightStatus.PUBLISHED ? AuditActions.RESEARCH_PUBLISHED : AuditActions.RESEARCH_APPROVED,
        ipAddress: ip,
      })
    }

    const authorIds = allAuthorUserIds(copyright.studentAuthors, copyright.facultyAuthors)
    await dispatchResearchStatusNotifications({
      resourceType: 'copyright', resourceId: id, title: copyright.title,
      oldTeacherStatus: existing.teacherStatus, newTeacherStatus: updateData.teacherStatus as TeacherStatus | undefined,
      oldMainStatus: existing.copyrightStatus, newMainStatus: updateData.copyrightStatus as string | undefined,
      updateComment: updateData.updateComment as string | null | undefined,
      allAuthorIds: authorIds, sessionUserId: userId, sessionRole: role,
    })

    if (rC === CopyrightStatus.PUBLISHED) {
      broadcastPublicationEmail({
        resourceType: 'copyright', resourceTitle: copyright.title, resourceId: id,
        authors: [...copyright.studentAuthors.map(sa => sa.user.name), ...copyright.facultyAuthors.map(fa => fa.user?.name)].filter(Boolean) as string[],
        excludeUserIds: authorIds,
      }).catch(() => {})
    }

    return NextResponse.json({ copyright })
  } catch (error) {
    console.error('[Copyright PATCH]', error)
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

    if (role === UserRole.STUDENT) return NextResponse.json({ error: 'Forbidden — students cannot delete copyrights' }, { status: 403 })

    const copyright = await prisma.copyright.findUnique({ where: { id }, include: { facultyAuthors: true } })
    if (!copyright) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (role === UserRole.FACULTY) {
      if (!copyright.facultyAuthors.some((fa) => fa.userId === userId)) {
        return NextResponse.json({ error: 'Forbidden — you can only delete copyrights you author' }, { status: 403 })
      }
    }

    await prisma.copyright.delete({ where: { id } })
    return NextResponse.json({ message: 'Copyright deleted successfully' })
  } catch (error) {
    console.error('[Copyright DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
