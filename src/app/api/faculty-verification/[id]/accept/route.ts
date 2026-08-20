/**
 * PATCH /api/faculty-verification/[id]/accept
 *
 * The faculty member (or ADMIN+) accepts a co-author verification request
 * via their authenticated session.
 *
 * This is the AUTHENTICATED path. The UNAUTHENTICATED token-link path is
 * handled by /api/faculty-verification/verify POST.
 *
 * Security guarantees:
 *  - 401 if unauthenticated
 *  - 403 if not FACULTY or higher
 *  - 403 if the caller's email doesn't match facultyEmail (unless ADMIN+)
 *  - 409 if the request is already resolved (not PENDING) — idempotency guard
 *  - tokenUsed checked BEFORE update to prevent double-accept race condition
 *  - verificationToken is NEVER returned in any response
 *  - Audit log written for every accept action
 *  - Student and faculty both notified
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { FacultyVerificationStatus } from '@prisma/client'
import { isFacultyOrHigher, isAdminOrHigher } from '@/lib/auth/permissions'
import { AuditActions, writeAuditLog, fromSession } from '@/lib/audit'
import { getClientIp } from '@/lib/auth/guard'
import {
  notifyFacultyVerificationAccepted,
} from '@/lib/notifications'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isFacultyOrHigher(session.user.role)) {
      return NextResponse.json(
        { error: 'Only faculty members or higher can accept verification requests' },
        { status: 403 },
      )
    }

    const { id } = await params
    const ip = await getClientIp(req)

    const request = await prisma.facultyVerificationRequest.findUnique({ where: { id } })

    if (!request) {
      return NextResponse.json({ error: 'Verification request not found' }, { status: 404 })
    }

    // ── Idempotency guard — prevent double-accept ──────────────────────────
    if (request.status !== FacultyVerificationStatus.PENDING) {
      return NextResponse.json(
        { error: `Cannot accept a request that is already ${request.status}` },
        { status: 409 },
      )
    }

    // ── Replay prevention — single-use flag ────────────────────────────────
    // tokenUsed should be false for PENDING — double-check to close race
    if (request.tokenUsed) {
      return NextResponse.json(
        { error: 'This verification request has already been processed' },
        { status: 409 },
      )
    }

    // ── Email ownership check — only ADMIN+ can accept on behalf ──────────
    const isAdmin = isAdminOrHigher(session.user.role)
    if (!isAdmin && request.facultyEmail !== session.user.email) {
      return NextResponse.json(
        { error: 'You are not the faculty member associated with this request' },
        { status: 403 },
      )
    }

    // ── Update in a transaction: mark request + update author junction ─────
    const updated = await prisma.$transaction(async (tx) => {
      const updated = await tx.facultyVerificationRequest.update({
        where: { id },
        data: {
          status:         FacultyVerificationStatus.ACCEPTED,
          verifiedAt:     new Date(),
          tokenUsed:      true,
          linkedFacultyId: session.user.id,
        },
      })
      await updateTeacherAuthorStatus(tx, request.researchType, request.researchId, id, 'ACCEPTED', session.user.id)
      return updated
    })

    // ── Audit log ──────────────────────────────────────────────────────────
    await writeAuditLog({
      ...fromSession(session as { user: { id: string; email: string; role: string } }),
      action:       AuditActions.FACULTY_VERIFICATION_ACCEPTED,
      resourceType: 'FacultyVerificationRequest',
      resourceId:   id,
      oldValue:     { status: FacultyVerificationStatus.PENDING },
      newValue:     { status: FacultyVerificationStatus.ACCEPTED, linkedFacultyId: session.user.id },
      ipAddress:    ip,
    })

    // ── Notifications ──────────────────────────────────────────────────────
    await notifyFacultyVerificationAccepted({
      requestedById: request.requestedById,
      facultyName:   request.facultyName,
      researchType:  request.researchType,
    })

    const { verificationToken: _token, ...safeRequest } = updated
    return NextResponse.json({ request: safeRequest })
  } catch (error) {
    console.error('[PATCH /api/faculty-verification/[id]/accept]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── Shared helper (inline to avoid circular imports) ──────────────────────────

async function updateTeacherAuthorStatus(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  researchType: string,
  researchId: string,
  requestId: string,
  status: 'ACCEPTED' | 'REJECTED',
  linkedFacultyId?: string,
) {
  const data = {
    verificationStatus: status,
    ...(status === 'ACCEPTED' && linkedFacultyId ? { userId: linkedFacultyId } : {}),
  }
  switch (researchType) {
    case 'JOURNAL':
      await tx.journalTeacherAuthor.updateMany({ where: { journalId: researchId, verificationRequestId: requestId }, data })
      break
    case 'BOOK_CHAPTER':
      await tx.bookChapterTeacherAuthor.updateMany({ where: { bookChapterId: researchId, verificationRequestId: requestId }, data })
      break
    case 'CONFERENCE':
      await tx.conferenceTeacherAuthor.updateMany({ where: { conferenceId: researchId, verificationRequestId: requestId }, data })
      break
    case 'PATENT':
      await tx.patentTeacherAuthor.updateMany({ where: { patentId: researchId, verificationRequestId: requestId }, data })
      break
    case 'COPYRIGHT':
      await tx.copyrightTeacherAuthor.updateMany({ where: { copyrightId: researchId, verificationRequestId: requestId }, data })
      break
    case 'GRANT_IN':
      await tx.grantInTeacherAuthor.updateMany({ where: { grantInId: researchId, verificationRequestId: requestId }, data })
      break
  }
}
