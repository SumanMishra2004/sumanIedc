/**
 * GET  /api/research/journal/[id]  — fetch single journal (IDOR-safe)
 * PATCH /api/research/journal/[id] — update with field allowlists + workflow
 * DELETE /api/research/journal/[id] — role-gated deletion
 *
 * Security guarantees:
 *  - Ownership checked via userId (never email — IDOR fix)
 *  - EDITOR+ can publish (fixes canPublishContent bug)
 *  - All status transitions validated via workflow engine
 *  - Field updates filtered through per-role allowlists (no mass assignment)
 *  - Every status change is audit-logged
 *  - 401 for unauthenticated, 403 for insufficient permission, 404 to hide existence
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/guard'
import {
  canViewAllResearch,
  canPublishContent,
  isEditorOrHigher,
  isAdminOrHigher,
  isFacultyOrHigher,
} from '@/lib/auth/permissions'
import {
  pickAllowedFields,
  getResearchUpdateAllowlist,
} from '@/lib/auth/field-allowlists'
import { AuditActions, writeAuditLog, fromSession } from '@/lib/audit'
import { getClientIp } from '@/lib/auth/guard'
import {
  canReadResearch,
  canWriteResearch,
  isLockedForStudent,
  validateResearchStatusChange,
  dispatchResearchStatusNotifications,
  auditResearchChange,
  allAuthorUserIds,
} from '@/lib/research/researchRouteHelpers'
import { TeacherStatus, JournalStatus, UserRole } from '@prisma/client'
import { broadcastPublicationEmail } from '@/lib/mail'

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const journal = await prisma.journal.findUnique({
      where: { id },
      include: {
        studentAuthors: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true, department: true },
            },
          },
        },
        facultyAuthors: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true, department: true },
            },
          },
        },
      },
    })

    if (!journal) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Public records are accessible without auth
    if (journal.isPublic && journal.journalStatus === JournalStatus.PUBLISHED) {
      return NextResponse.json({ journal })
    }

    // Private records require authentication
    const guard = await requireAuth(req)
    if (!guard.ok) return guard.response

    const { session } = guard

    // EDITOR+ sees everything; others need ownership via userId
    if (!canViewAllResearch(session.user.role)) {
      const hasAccess = canReadResearch(session.user, {
        studentAuthors: journal.studentAuthors,
        facultyAuthors: journal.facultyAuthors,
      })
      if (!hasAccess) {
        // Return 404 to avoid leaking resource existence
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    }

    return NextResponse.json({ journal })
  } catch (error) {
    console.error('[Journal GET]', error)
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

    // ── 1. Fetch existing record ────────────────────────────────────────────
    const existing = await prisma.journal.findUnique({
      where: { id },
      include: { studentAuthors: true, facultyAuthors: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // ── 2. Ownership / access check ─────────────────────────────────────────
    if (!canWriteResearch(session.user, existing)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ── 3. Student lock check ───────────────────────────────────────────────
    if (role === UserRole.STUDENT) {
      if (isLockedForStudent(existing.teacherStatus, existing.journalStatus === JournalStatus.PUBLISHED)) {
        return NextResponse.json(
          { error: 'This journal is locked and cannot be edited at this stage' },
          { status: 403 },
        )
      }
    }

    // ── 4. Extract only allowed fields for this role ─────────────────────────
    const allowlist = getResearchUpdateAllowlist('journal', role)
    const safeBody = pickAllowedFields(body, allowlist) as Record<string, unknown>

    // Author ID updates come separately (not in the field allowlist)
    const wantsStudentAuthorUpdate = Array.isArray(body.studentAuthorIds)
    const wantsFacultyAuthorUpdate = Array.isArray(body.facultyAuthorIds)

    // ── 5. Validate status transitions ──────────────────────────────────────
    const newTeacherStatus  = safeBody.teacherStatus as TeacherStatus | undefined
    const newJournalStatus  = safeBody.journalStatus as JournalStatus | undefined

    const statusResult = validateResearchStatusChange(
      role,
      'journal',
      existing.teacherStatus,
      existing.journalStatus,
      newTeacherStatus,
      newJournalStatus,
    )
    if (statusResult.error) return statusResult.error

    // ── 6. Automated side-effects ───────────────────────────────────────────
    if (role === UserRole.STUDENT && existing.teacherStatus === TeacherStatus.UPDATE) {
      safeBody.teacherStatus    = TeacherStatus.UPLOADED
      safeBody.updateComment    = null
    }

    // Apply implied main status from teacher transition
    if (statusResult.impliedMainStatus) {
      safeBody.journalStatus = statusResult.impliedMainStatus
    }

    // Publishing → force isPublic = true
    const resolvedJournalStatus = (safeBody.journalStatus ?? existing.journalStatus) as JournalStatus
    if (resolvedJournalStatus === JournalStatus.PUBLISHED) {
      if (!canPublishContent(role)) {
        return NextResponse.json(
          { error: 'Forbidden — only EDITOR or higher can publish journals' },
          { status: 403 },
        )
      }
      safeBody.isPublic     = true
      safeBody.teacherStatus = TeacherStatus.PUBLISHED
    }

    // ── 7. Validate author ID arrays ────────────────────────────────────────
    if (wantsStudentAuthorUpdate) {
      const sIds: string[] = body.studentAuthorIds
      if (new Set(sIds).size !== sIds.length) {
        return NextResponse.json({ error: 'Duplicate student authors detected' }, { status: 400 })
      }
      const valid = await prisma.user.findMany({
        where: { id: { in: sIds }, role: UserRole.STUDENT },
      })
      if (valid.length !== sIds.length) {
        return NextResponse.json({ error: 'One or more student authors are invalid' }, { status: 400 })
      }
      if (role === UserRole.STUDENT && !sIds.includes(userId)) {
        return NextResponse.json(
          { error: 'You must remain listed as an author on your own publication' },
          { status: 400 },
        )
      }
    }

    if (wantsFacultyAuthorUpdate) {
      const fIds: string[] = body.facultyAuthorIds
      if (new Set(fIds).size !== fIds.length) {
        return NextResponse.json({ error: 'Duplicate faculty authors detected' }, { status: 400 })
      }
      const valid = await prisma.user.findMany({
        where: {
          id: { in: fIds },
          role: { in: ['FACULTY', 'EDITOR', 'ADMIN', 'SUPERADMIN'] as UserRole[] },
        },
      })
      if (valid.length !== fIds.length) {
        return NextResponse.json({ error: 'One or more faculty authors are invalid' }, { status: 400 })
      }
    }

    // ── 8. Check duplicate serial number if changed ─────────────────────────
    if (safeBody.serialNo && safeBody.serialNo !== existing.serialNo) {
      const dup = await prisma.journal.findUnique({ where: { serialNo: safeBody.serialNo as string } })
      if (dup) {
        return NextResponse.json({ error: 'A journal with this serial number already exists' }, { status: 400 })
      }
    }

    // ── 9. Build update payload ─────────────────────────────────────────────
    const updateData: Record<string, unknown> = { ...safeBody }

    // Parse numeric/date fields
    if (safeBody.impactFactor !== undefined)
      updateData.impactFactor = safeBody.impactFactor ? parseFloat(safeBody.impactFactor as string) : null
    if (safeBody.impactFactorDate !== undefined)
      updateData.impactFactorDate = safeBody.impactFactorDate ? new Date(safeBody.impactFactorDate as string) : null
    if (safeBody.publicationDate !== undefined)
      updateData.publicationDate = safeBody.publicationDate ? new Date(safeBody.publicationDate as string) : null
    if (safeBody.registrationFees !== undefined)
      updateData.registrationFees = safeBody.registrationFees ? parseFloat(safeBody.registrationFees as string) : null
    if (safeBody.reimbursement !== undefined)
      updateData.reimbursement = safeBody.reimbursement ? parseFloat(safeBody.reimbursement as string) : null

    // Author relationship updates (replace-all strategy)
    if (wantsStudentAuthorUpdate) {
      await prisma.journalStudentAuthor.deleteMany({ where: { journalId: id } })
      updateData.studentAuthors = {
        create: (body.studentAuthorIds as string[]).map((uId) => ({ userId: uId })),
      }
    }
    if (wantsFacultyAuthorUpdate) {
      await prisma.journalTeacherAuthor.deleteMany({ where: { journalId: id } })
      updateData.facultyAuthors = {
        create: (body.facultyAuthorIds as string[]).map((uId) => ({
          userId: uId,
          verificationStatus: 'ACCEPTED',
        })),
      }
    }

    // ── 10. Persist ─────────────────────────────────────────────────────────
    const journal = await prisma.journal.update({
      where: { id },
      data: updateData,
      include: {
        studentAuthors: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        facultyAuthors: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    })

    // ── 11. Audit log for status changes ────────────────────────────────────
    const resolvedTeacher = (updateData.teacherStatus ?? existing.teacherStatus) as TeacherStatus
    const resolvedMain    = (updateData.journalStatus ?? existing.journalStatus) as JournalStatus

    if (resolvedTeacher !== existing.teacherStatus || resolvedMain !== existing.journalStatus) {
      await auditResearchChange({
        session:      session as { user: { id: string; email: string; role: string } },
        resourceType: 'Journal',
        resourceId:   id,
        oldStatus:    `${existing.teacherStatus}/${existing.journalStatus}`,
        newStatus:    `${resolvedTeacher}/${resolvedMain}`,
        action:       resolvedMain === JournalStatus.PUBLISHED
          ? AuditActions.RESEARCH_PUBLISHED
          : AuditActions.RESEARCH_APPROVED,
        ipAddress:    ip,
      })
    }

    // ── 12. Notifications ───────────────────────────────────────────────────
    const authorIds = allAuthorUserIds(journal.studentAuthors, journal.facultyAuthors)
    await dispatchResearchStatusNotifications({
      resourceType:     'journal',
      resourceId:       id,
      title:            journal.title,
      oldTeacherStatus: existing.teacherStatus,
      newTeacherStatus: updateData.teacherStatus as TeacherStatus | undefined,
      oldMainStatus:    existing.journalStatus,
      newMainStatus:    updateData.journalStatus as string | undefined,
      updateComment:    updateData.updateComment as string | null | undefined,
      allAuthorIds:     authorIds,
      sessionUserId:    userId,
      sessionRole:      role,
    })

    // Broadcast email on publication
    if (resolvedMain === JournalStatus.PUBLISHED) {
      const authorNames = [
        ...journal.studentAuthors.map((sa) => sa.user.name).filter(Boolean),
        ...journal.facultyAuthors.map((fa) => fa.user?.name).filter(Boolean),
      ] as string[]
      broadcastPublicationEmail({
        resourceType:   'journal',
        resourceTitle:  journal.title,
        resourceId:     id,
        authors:        authorNames,
        excludeUserIds: authorIds,
      }).catch((err) => console.error('[Journal] Broadcast failed:', err))
    }

    return NextResponse.json({ journal })
  } catch (error) {
    console.error('[Journal PATCH]', error)
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

    // STUDENT cannot delete
    if (role === UserRole.STUDENT) {
      return NextResponse.json(
        { error: 'Forbidden — students cannot delete journals' },
        { status: 403 },
      )
    }

    const journal = await prisma.journal.findUnique({
      where: { id },
      include: { facultyAuthors: true },
    })
    if (!journal) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // FACULTY can only delete journals where they are a faculty author
    if (role === UserRole.FACULTY) {
      const isAuthor = journal.facultyAuthors.some((fa) => fa.userId === userId)
      if (!isAuthor) {
        return NextResponse.json(
          { error: 'Forbidden — you can only delete journals you author' },
          { status: 403 },
        )
      }
    }

    // EDITOR can delete any journal (editorial authority)
    // ADMIN/SUPERADMIN can delete any

    await prisma.journal.delete({ where: { id } })

    writeAuditLog({
      ...fromSession(session as { user: { id: string; email: string; role: string } }),
      action:       AuditActions.RESEARCH_PUBLISHED, // closest available — use RESEARCH_SUBMITTED as proxy
      resourceType: 'Journal',
      resourceId:   id,
      reason:       'Journal deleted',
    }).catch(() => {})

    return NextResponse.json({ message: 'Journal deleted successfully' })
  } catch (error) {
    console.error('[Journal DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
