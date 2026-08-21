/**
 * PATCH /api/faculty-verification/[id]/reject
 *
 * The faculty member (or ADMIN+) rejects a co-author verification request
 * via their authenticated session.
 *
 * Security guarantees:
 *  - 401 if unauthenticated
 *  - 403 if not FACULTY or higher
 *  - 403 if caller's email doesn't match facultyEmail (unless ADMIN+)
 *  - 409 if already resolved (idempotency guard)
 *  - tokenUsed pre-checked to close race condition
 *  - DB update + author junction wrapped in transaction
 *  - verificationToken NEVER returned in response
 *  - Audit log written for every reject
 *  - Student notified via centralized notification service
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { FacultyVerificationStatus } from '@prisma/client'
import { isFacultyOrHigher, isAdminOrHigher } from '@/lib/auth/permissions'
import { AuditActions, writeAuditLog, fromSession } from '@/lib/audit'
import { getClientIp } from '@/lib/auth/guard'
import { notifyFacultyVerificationRejected } from '@/lib/notifications'

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
        { error: 'Only faculty members or higher can reject verification requests' },
        { status: 403 },
      )
    }

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const rejectionReason: string | null = body?.rejectionReason ?? null
    const ip = await getClientIp(req)

    const request = await prisma.facultyVerificationRequest.findUnique({ where: { id } })

    if (!request) {
      return NextResponse.json({ error: 'Verification request not found' }, { status: 404 })
    }

    // Idempotency guard
    if (request.status !== FacultyVerificationStatus.PENDING) {
      return NextResponse.json(
        { error: `Cannot reject a request that is already ${request.status}` },
        { status: 409 },
      )
    }

    // Replay prevention — single-use token flag
    if (request.tokenUsed) {
      return NextResponse.json(
        { error: 'This verification request has already been processed' },
        { status: 409 },
      )
    }

    // Email ownership check — only ADMIN+ can reject on behalf
    const isAdmin = isAdminOrHigher(session.user.role)
    if (!isAdmin && request.facultyEmail !== session.user.email) {
      return NextResponse.json(
        { error: 'You are not the faculty member associated with this request' },
        { status: 403 },
      )
    }

    // Transaction: update request + update author junction atomically
    const updated = await prisma.$transaction(async (tx) => {
      const updated = await tx.facultyVerificationRequest.update({
        where: { id },
        data: {
          status:          FacultyVerificationStatus.REJECTED,
          rejectionReason: rejectionReason,
          verifiedAt:      new Date(),
          tokenUsed:       true,
        },
      })
      await updateTeacherAuthorStatus(tx, request.researchType, request.researchId, id, 'REJECTED')
      return updated
    })

    // Audit log — always awaited for verification events
    await writeAuditLog({
      ...fromSession(session as { user: { id: string; email: string; role: string } }),
      action:       AuditActions.FACULTY_VERIFICATION_REJECTED,
      resourceType: 'FacultyVerificationRequest',
      resourceId:   id,
      oldValue:     { status: FacultyVerificationStatus.PENDING },
      newValue:     { status: FacultyVerificationStatus.REJECTED, rejectionReason },
      ipAddress:    ip,
    })

    // Notify the requesting student
    await notifyFacultyVerificationRejected({
      requestedById: request.requestedById,
      facultyName:   request.facultyName,
      researchType:  request.researchType,
      reason:        rejectionReason ?? undefined,
    })

    const { verificationToken: _token, ...safeRequest } = updated
    return NextResponse.json({ request: safeRequest })
  } catch (error) {
    console.error('[PATCH /api/faculty-verification/[id]/reject]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── Shared transaction-compatible helper ──────────────────────────────────────
async function updateTeacherAuthorStatus(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  researchType: string,
  researchId: string,
  requestId: string,
  status: 'ACCEPTED' | 'REJECTED',
) {
  const data = { verificationStatus: status }
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
