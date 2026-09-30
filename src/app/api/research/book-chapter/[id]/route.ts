/**
 * GET  /api/research/book-chapter/[id]
 * PATCH /api/research/book-chapter/[id]
 * DELETE /api/research/book-chapter/[id]
 *
 * Security: IDOR-safe (userId comparison), workflow engine, field allowlists,
 * EDITOR+ publish authority, audit logging, 401/403/404 semantics.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, getClientIp } from '@/lib/auth/guard'
import { canViewAllResearch, canPublishContent } from '@/lib/auth/permissions'
import { pickAllowedFields, getResearchUpdateAllowlist } from '@/lib/auth/field-allowlists'
import { AuditActions, writeAuditLog, fromSession } from '@/lib/audit'
import {
  canReadResearch,
  canWriteResearch,
  isLockedForStudent,
  validateResearchStatusChange,
  dispatchResearchStatusNotifications,
  auditResearchChange,
  allAuthorUserIds,
} from '@/lib/research/researchRouteHelpers'
import { TeacherStatus, BookchapterStatus, UserRole } from '@prisma/client'
import { broadcastPublicationEmail } from '@/lib/mail'

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const chapter = await prisma.bookChapter.findUnique({
      where: { id },
      include: {
        studentAuthors: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true, department: true } },
          },
        },
        facultyAuthors: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true, department: true } },
          },
        },
      },
    })

    if (!chapter) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (chapter.isPublic && chapter.bookChapterStatus === BookchapterStatus.PUBLISHED) {
      return NextResponse.json({ bookChapter: chapter })
    }

    const guard = await requireAuth(req)
    if (!guard.ok) return guard.response
    const { session } = guard

    if (!canViewAllResearch(session.user.role)) {
      if (!canReadResearch(session.user, { studentAuthors: chapter.studentAuthors, facultyAuthors: chapter.facultyAuthors })) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    }

    return NextResponse.json({ bookChapter: chapter })
  } catch (error) {
    console.error('[BookChapter GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

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

    const existing = await prisma.bookChapter.findUnique({
      where: { id },
      include: { studentAuthors: true, facultyAuthors: true },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!canWriteResearch(session.user, existing)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (role === UserRole.STUDENT) {
      if (isLockedForStudent(existing.teacherStatus, existing.bookChapterStatus === BookchapterStatus.PUBLISHED)) {
        return NextResponse.json({ error: 'This book chapter is locked and cannot be edited at this stage' }, { status: 403 })
      }
    }

    const allowlist = getResearchUpdateAllowlist('book-chapter', role)
    const safeBody  = pickAllowedFields(body, allowlist) as Record<string, unknown>

    const wantsStudentUpdate  = Array.isArray(body.studentAuthorIds)
    const wantsFacultyUpdate  = Array.isArray(body.facultyAuthorIds)

    const newTeacherStatus  = safeBody.teacherStatus as TeacherStatus | undefined
    const newChapterStatus  = safeBody.bookChapterStatus as BookchapterStatus | undefined

    const statusResult = validateResearchStatusChange(
      role, 'book-chapter',
      existing.teacherStatus, existing.bookChapterStatus,
      newTeacherStatus, newChapterStatus,
    )
    if (statusResult.error) return statusResult.error

    // Automated side-effects
    if (role === UserRole.STUDENT && existing.teacherStatus === TeacherStatus.UPDATE) {
      safeBody.teacherStatus = TeacherStatus.UPLOADED
      safeBody.updateComment = null
    }
    if (statusResult.impliedMainStatus) safeBody.bookChapterStatus = statusResult.impliedMainStatus

    const resolvedStatus = (safeBody.bookChapterStatus ?? existing.bookChapterStatus) as BookchapterStatus
    if (resolvedStatus === BookchapterStatus.PUBLISHED) {
      if (!canPublishContent(role)) {
        return NextResponse.json({ error: 'Forbidden — only EDITOR or higher can publish' }, { status: 403 })
      }
      safeBody.isPublic      = true
      safeBody.teacherStatus = TeacherStatus.PUBLISHED
    }

    // Author validation
    if (wantsStudentUpdate) {
      const sIds: string[] = body.studentAuthorIds
      if (new Set(sIds).size !== sIds.length) return NextResponse.json({ error: 'Duplicate student authors' }, { status: 400 })
      const valid = await prisma.user.findMany({ where: { id: { in: sIds }, role: UserRole.STUDENT } })
      if (valid.length !== sIds.length) return NextResponse.json({ error: 'One or more student authors are invalid' }, { status: 400 })
      if (role === UserRole.STUDENT && !sIds.includes(userId)) {
        return NextResponse.json({ error: 'You must remain listed as an author' }, { status: 400 })
      }
    }
    if (wantsFacultyUpdate) {
      const fIds: string[] = body.facultyAuthorIds
      if (new Set(fIds).size !== fIds.length) return NextResponse.json({ error: 'Duplicate faculty authors' }, { status: 400 })
      const valid = await prisma.user.findMany({
        where: { id: { in: fIds }, role: { in: ['FACULTY','EDITOR','ADMIN','SUPERADMIN'] as UserRole[] } },
      })
      if (valid.length !== fIds.length) return NextResponse.json({ error: 'One or more faculty authors are invalid' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { ...safeBody }
    if (safeBody.publicationDate !== undefined) updateData.publicationDate = safeBody.publicationDate ? new Date(safeBody.publicationDate as string) : null
    if (safeBody.registrationFees !== undefined) updateData.registrationFees = safeBody.registrationFees ? parseFloat(safeBody.registrationFees as string) : null
    if (safeBody.reimbursement !== undefined) updateData.reimbursement = safeBody.reimbursement ? parseFloat(safeBody.reimbursement as string) : null

    if (wantsStudentUpdate) {
      await prisma.bookChapterStudentAuthor.deleteMany({ where: { bookChapterId: id } })
      updateData.studentAuthors = { create: (body.studentAuthorIds as string[]).map((uId) => ({ userId: uId })) }
    }
    if (wantsFacultyUpdate) {
      await prisma.bookChapterTeacherAuthor.deleteMany({ where: { bookChapterId: id } })
      updateData.facultyAuthors = {
        create: (body.facultyAuthorIds as string[]).map((uId) => ({ userId: uId, verificationStatus: 'ACCEPTED' })),
      }
    }

    const chapter = await prisma.bookChapter.update({
      where: { id },
      data: updateData,
      include: {
        studentAuthors: { include: { user: { select: { id: true, name: true, email: true } } } },
        facultyAuthors: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    })

    const resolvedTeacher = (updateData.teacherStatus ?? existing.teacherStatus) as TeacherStatus
    const resolvedMain    = (updateData.bookChapterStatus ?? existing.bookChapterStatus) as BookchapterStatus
    if (resolvedTeacher !== existing.teacherStatus || resolvedMain !== existing.bookChapterStatus) {
      await auditResearchChange({
        session: session as { user: { id: string; email: string; role: string } },
        resourceType: 'BookChapter', resourceId: id,
        oldStatus: `${existing.teacherStatus}/${existing.bookChapterStatus}`,
        newStatus: `${resolvedTeacher}/${resolvedMain}`,
        action: resolvedMain === BookchapterStatus.PUBLISHED ? AuditActions.RESEARCH_PUBLISHED : AuditActions.RESEARCH_APPROVED,
        ipAddress: ip,
      })
    }

    const authorIds = allAuthorUserIds(chapter.studentAuthors, chapter.facultyAuthors)
    await dispatchResearchStatusNotifications({
      resourceType: 'book-chapter', resourceId: id, title: chapter.title,
      oldTeacherStatus: existing.teacherStatus, newTeacherStatus: updateData.teacherStatus as TeacherStatus | undefined,
      oldMainStatus: existing.bookChapterStatus, newMainStatus: updateData.bookChapterStatus as string | undefined,
      updateComment: updateData.updateComment as string | null | undefined,
      allAuthorIds: authorIds, sessionUserId: userId, sessionRole: role,
    })

    if (resolvedMain === BookchapterStatus.PUBLISHED) {
      broadcastPublicationEmail({
        resourceType: 'book-chapter', resourceTitle: chapter.title, resourceId: id,
        authors: [...chapter.studentAuthors.map(sa => sa.user.name), ...chapter.facultyAuthors.map(fa => fa.user?.name)].filter(Boolean) as string[],
        excludeUserIds: authorIds,
      }).catch(() => {})
    }

    return NextResponse.json({ bookChapter: chapter })
  } catch (error) {
    console.error('[BookChapter PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

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

    if (role === UserRole.STUDENT) {
      return NextResponse.json({ error: 'Forbidden — students cannot delete book chapters' }, { status: 403 })
    }

    const chapter = await prisma.bookChapter.findUnique({
      where: { id }, include: { facultyAuthors: true },
    })
    if (!chapter) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (role === UserRole.FACULTY) {
      if (!chapter.facultyAuthors.some((fa) => fa.userId === userId)) {
        return NextResponse.json({ error: 'Forbidden — you can only delete book chapters you author' }, { status: 403 })
      }
    }

    await prisma.bookChapter.delete({ where: { id } })
    return NextResponse.json({ message: 'Book chapter deleted successfully' })
  } catch (error) {
    console.error('[BookChapter DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
