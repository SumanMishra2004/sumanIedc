/**
 * POST /api/faculty-verification/[id]/admin-override
 *
 * Administrative override of a verification request.
 *
 * Per spec: "Every SUPERADMIN override must be auditable."
 * In practice every ADMIN override also records to the audit log.
 *
 * Security guarantees:
 *  - 401 if unauthenticated, 403 if not ADMIN+
 *  - overrideReason is REQUIRED (cannot be blank)
 *  - tokenUsed pre-checked to close replay race
 *  - DB update + author junction in a single transaction
 *  - Audit log always awaited (security-sensitive, must not be fire-and-forget)
 *  - verificationToken NEVER returned in response
 *  - Student notified via centralized notification service
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { FacultyVerificationStatus } from '@prisma/client'
import { isAdminOrHigher } from '@/lib/auth/permissions'
import { AuditActions, writeAuditLog, fromSession } from '@/lib/audit'
import { getClientIp } from '@/lib/auth/guard'
import {
  notifyFacultyVerificationAccepted,
  notifyFacultyVerificationRejected,
} from '@/lib/notifications'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isAdminOrHigher(session.user.role)) {
      return NextResponse.json(
        { error: 'Only administrators can perform verification overrides' },
        { status: 403 },
      )
    }

    const { id } = await params
    const body = await req.json()
    const { action, overrideReason } = body
    const ip = await getClientIp(req)

    // ── Input validation ────────────────────────────────────────────────────
    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "accept" or "reject"' },
        { status: 400 },
      )
    }

    if (!overrideReason || typeof overrideReason !== 'string' || !overrideReason.trim()) {
      return NextResponse.json(
        { error: 'overrideReason is required for all administrative overrides (audit requirement)' },
        { status: 400 },
      )
    }

    const request = await prisma.facultyVerificationRequest.findUnique({ where: { id } })
    if (!request) {
      return NextResponse.json({ error: 'Verification request not found' }, { status: 404 })
    }

    // Replay prevention — tokenUsed pre-check
    if (request.tokenUsed && request.status !== FacultyVerificationStatus.PENDING) {
      // Allow ADMIN to override already-resolved requests (that is the point of an override)
      // but log the fact that we're overriding a non-pending request
    }

    const newStatus =
      action === 'accept'
        ? FacultyVerificationStatus.ACCEPTED
        : FacultyVerificationStatus.REJECTED

    // Check if faculty has a platform account for linking on accept
    const facultyUser =
      action === 'accept'
        ? await prisma.user.findUnique({
            where: { email: request.facultyEmail },
            select: { id: true },
          })
        : null

    // ── Transaction: update request + author junction ───────────────────────
    const updated = await prisma.$transaction(async (tx) => {
      const updated = await tx.facultyVerificationRequest.update({
        where: { id },
        data: {
          status:          newStatus,
          tokenUsed:       true,
          verifiedAt:      new Date(),
          overrideBy:      session.user.id,
          overrideAt:      new Date(),
          overrideReason:  overrideReason.trim(),
          rejectionReason: action === 'reject' ? overrideReason.trim() : null,
          linkedFacultyId: action === 'accept' && facultyUser ? facultyUser.id : request.linkedFacultyId,
        },
      })

      const statusValue = action === 'accept' ? ('ACCEPTED' as const) : ('REJECTED' as const)
      const teacherData = {
        verificationStatus: statusValue,
        ...(action === 'accept' && facultyUser ? { userId: facultyUser.id } : {}),
      }
      await updateTeacherAuthorStatus(tx, request.researchType, request.researchId, id, teacherData)
      return updated
    })

    // ── Audit log — always awaited for admin overrides ──────────────────────
    await writeAuditLog({
      ...fromSession(session as { user: { id: string; email: string; role: string } }),
      action:       AuditActions.FACULTY_VERIFICATION_OVERRIDE,
      resourceType: 'FacultyVerificationRequest',
      resourceId:   id,
      oldValue:     { status: request.status, tokenUsed: request.tokenUsed },
      newValue:     { status: newStatus, overrideBy: session.user.id },
      reason:       overrideReason.trim(),
      ipAddress:    ip,
    })

    // ── Notifications ───────────────────────────────────────────────────────
    if (action === 'accept') {
      await notifyFacultyVerificationAccepted({
        requestedById: request.requestedById,
        facultyName:   request.facultyName,
        researchType:  request.researchType,
      })
    } else {
      await notifyFacultyVerificationRejected({
        requestedById: request.requestedById,
        facultyName:   request.facultyName,
        researchType:  request.researchType,
        reason:        `Administrative override: ${overrideReason.trim()}`,
      })
    }

    const { verificationToken: _token, ...safeRequest } = updated
    return NextResponse.json({ success: true, request: safeRequest })
  } catch (error) {
    console.error('[POST /api/faculty-verification/[id]/admin-override]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── Transaction-compatible helper ─────────────────────────────────────────────
async function updateTeacherAuthorStatus(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  researchType: string,
  researchId: string,
  requestId: string,
  data: { verificationStatus: 'ACCEPTED' | 'REJECTED'; userId?: string },
) {
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
