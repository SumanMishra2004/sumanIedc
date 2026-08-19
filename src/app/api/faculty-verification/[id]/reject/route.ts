/**
 * PATCH /api/faculty-verification/[id]/reject
 *
 * The faculty member rejects a co-author verification request.
 *
 * Security:
 *  - User must be FACULTY or higher.
 *  - User's email must match the request's facultyEmail (or be ADMIN/SUPERADMIN).
 *  - Students CANNOT reject their own requests.
 *  - Must supply a rejectionReason (optional but strongly encouraged).
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { FacultyVerificationStatus } from '@prisma/client'
import { isFacultyOrHigher, isAdminOrHigher } from '@/lib/auth/permissions'

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

    const request = await prisma.facultyVerificationRequest.findUnique({ where: { id } })

    if (!request) {
      return NextResponse.json({ error: 'Verification request not found' }, { status: 404 })
    }

    if (request.status !== FacultyVerificationStatus.PENDING) {
      return NextResponse.json(
        { error: `Cannot reject a request that is already ${request.status}` },
        { status: 409 },
      )
    }

    const isAdmin = isAdminOrHigher(session.user.role)
    if (!isAdmin && request.facultyEmail !== session.user.email) {
      return NextResponse.json(
        { error: 'You are not the faculty member associated with this request' },
        { status: 403 },
      )
    }

    const updated = await prisma.facultyVerificationRequest.update({
      where: { id },
      data: {
        status: FacultyVerificationStatus.REJECTED,
        rejectionReason,
        verifiedAt: new Date(),
        tokenUsed: true,
      },
    })

    // Update teacher-author record
    await updateTeacherAuthorStatusRejected(request.researchType, request.researchId, id)

    // Notify the student
    await prisma.notification.create({
      data: {
        userId: request.requestedById,
        title: 'Faculty Co-Author Verification Rejected',
        message: `${request.facultyName} has rejected your co-author verification request.${
          rejectionReason ? ` Reason: ${rejectionReason}` : ''
        }`,
        type: 'FACULTY_VERIFICATION_REJECTED',
        link: `/dashboard/${request.researchType.toLowerCase().replace('_', '-')}`,
      },
    }).catch((e) => console.error('[reject] Failed to notify student:', e))

    const { verificationToken: _token, ...safeRequest } = updated
    return NextResponse.json({ request: safeRequest })
  } catch (error) {
    console.error('[PATCH /api/faculty-verification/[id]/reject]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function updateTeacherAuthorStatusRejected(
  researchType: string,
  researchId: string,
  requestId: string,
) {
  const data = { verificationStatus: 'REJECTED' as const }
  switch (researchType) {
    case 'JOURNAL':
      await prisma.journalTeacherAuthor.updateMany({ where: { journalId: researchId, verificationRequestId: requestId }, data })
      break
    case 'BOOK_CHAPTER':
      await prisma.bookChapterTeacherAuthor.updateMany({ where: { bookChapterId: researchId, verificationRequestId: requestId }, data })
      break
    case 'CONFERENCE':
      await prisma.conferenceTeacherAuthor.updateMany({ where: { conferenceId: researchId, verificationRequestId: requestId }, data })
      break
    case 'PATENT':
      await prisma.patentTeacherAuthor.updateMany({ where: { patentId: researchId, verificationRequestId: requestId }, data })
      break
    case 'COPYRIGHT':
      await prisma.copyrightTeacherAuthor.updateMany({ where: { copyrightId: researchId, verificationRequestId: requestId }, data })
      break
    case 'GRANT_IN':
      await prisma.grantInTeacherAuthor.updateMany({ where: { grantInId: researchId, verificationRequestId: requestId }, data })
      break
  }
}
