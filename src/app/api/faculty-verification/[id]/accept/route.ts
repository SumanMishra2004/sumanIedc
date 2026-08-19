/**
 * PATCH /api/faculty-verification/[id]/accept
 *
 * The faculty member accepts a co-author verification request.
 *
 * Security requirements:
 *  - User must be authenticated.
 *  - User must have FACULTY or higher role.
 *  - User's email must match the facultyEmail on the request (or be ADMIN/SUPERADMIN).
 *  - The request must be in PENDING status.
 *  - Students CANNOT accept their own requests (enforced by role check + email match).
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { FacultyVerificationStatus } from '@prisma/client'
import { isFacultyOrHigher, isAdminOrHigher } from '@/lib/auth/permissions'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Must be FACULTY or higher
    if (!isFacultyOrHigher(session.user.role)) {
      return NextResponse.json(
        { error: 'Only faculty members or higher can accept verification requests' },
        { status: 403 },
      )
    }

    const { id } = await params

    const request = await prisma.facultyVerificationRequest.findUnique({ where: { id } })

    if (!request) {
      return NextResponse.json({ error: 'Verification request not found' }, { status: 404 })
    }

    if (request.status !== FacultyVerificationStatus.PENDING) {
      return NextResponse.json(
        { error: `Cannot accept a request that is already ${request.status}` },
        { status: 409 },
      )
    }

    // Non-admins must match the faculty email on the request
    const isAdmin = isAdminOrHigher(session.user.role)
    if (!isAdmin && request.facultyEmail !== session.user.email) {
      return NextResponse.json(
        { error: 'You are not the faculty member associated with this request' },
        { status: 403 },
      )
    }

    // Update the verification request
    const updated = await prisma.facultyVerificationRequest.update({
      where: { id },
      data: {
        status: FacultyVerificationStatus.ACCEPTED,
        verifiedAt: new Date(),
        tokenUsed: true,
        linkedFacultyId: session.user.id,
      },
    })

    // ── Update the teacher-author record's verificationStatus ────────────
    await updateTeacherAuthorStatus(request.researchType, request.researchId, id, 'ACCEPTED', session.user.id)

    // ── Notify the student who made the request ──────────────────────────
    await prisma.notification.create({
      data: {
        userId: request.requestedById,
        title: 'Faculty Co-Author Verified',
        message: `${request.facultyName} has accepted your co-author verification request.`,
        type: 'FACULTY_VERIFICATION_ACCEPTED',
        link: `/dashboard/${request.researchType.toLowerCase().replace('_', '-')}`,
      },
    }).catch((e) => console.error('[accept] Failed to notify student:', e))

    const { verificationToken: _token, ...safeRequest } = updated
    return NextResponse.json({ request: safeRequest })
  } catch (error) {
    console.error('[PATCH /api/faculty-verification/[id]/accept]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Helper: update the corresponding TeacherAuthor junction record's
 * verificationStatus to reflect the new state.
 */
async function updateTeacherAuthorStatus(
  researchType: string,
  researchId: string,
  requestId: string,
  status: 'ACCEPTED' | 'REJECTED',
  linkedFacultyId?: string,
) {
  const statusValue = status === 'ACCEPTED' ? 'ACCEPTED' : 'REJECTED'

  switch (researchType) {
    case 'JOURNAL':
      await prisma.journalTeacherAuthor.updateMany({
        where: { journalId: researchId, verificationRequestId: requestId },
        data: {
          verificationStatus: statusValue,
          ...(status === 'ACCEPTED' && linkedFacultyId ? { userId: linkedFacultyId } : {}),
        },
      })
      break
    case 'BOOK_CHAPTER':
      await prisma.bookChapterTeacherAuthor.updateMany({
        where: { bookChapterId: researchId, verificationRequestId: requestId },
        data: {
          verificationStatus: statusValue,
          ...(status === 'ACCEPTED' && linkedFacultyId ? { userId: linkedFacultyId } : {}),
        },
      })
      break
    case 'CONFERENCE':
      await prisma.conferenceTeacherAuthor.updateMany({
        where: { conferenceId: researchId, verificationRequestId: requestId },
        data: {
          verificationStatus: statusValue,
          ...(status === 'ACCEPTED' && linkedFacultyId ? { userId: linkedFacultyId } : {}),
        },
      })
      break
    case 'PATENT':
      await prisma.patentTeacherAuthor.updateMany({
        where: { patentId: researchId, verificationRequestId: requestId },
        data: {
          verificationStatus: statusValue,
          ...(status === 'ACCEPTED' && linkedFacultyId ? { userId: linkedFacultyId } : {}),
        },
      })
      break
    case 'COPYRIGHT':
      await prisma.copyrightTeacherAuthor.updateMany({
        where: { copyrightId: researchId, verificationRequestId: requestId },
        data: {
          verificationStatus: statusValue,
          ...(status === 'ACCEPTED' && linkedFacultyId ? { userId: linkedFacultyId } : {}),
        },
      })
      break
    case 'GRANT_IN':
      await prisma.grantInTeacherAuthor.updateMany({
        where: { grantInId: researchId, verificationRequestId: requestId },
        data: {
          verificationStatus: statusValue,
          ...(status === 'ACCEPTED' && linkedFacultyId ? { userId: linkedFacultyId } : {}),
        },
      })
      break
  }
}
