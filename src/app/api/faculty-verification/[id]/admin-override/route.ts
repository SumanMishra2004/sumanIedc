/**
 * POST /api/faculty-verification/[id]/admin-override
 *
 * Admin/SuperAdmin explicit override of a verification request.
 *
 * This is distinct from the normal accept/reject flow — it records:
 *  - Who performed the override
 *  - When it was done
 *  - The reason given
 *
 * The override is always an explicit administrative action, never automatic.
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { FacultyVerificationStatus } from '@prisma/client'
import { isAdminOrHigher } from '@/lib/auth/permissions'

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

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "accept" or "reject"' },
        { status: 400 },
      )
    }

    if (!overrideReason || typeof overrideReason !== 'string' || !overrideReason.trim()) {
      return NextResponse.json(
        { error: 'An override reason is required for audit purposes' },
        { status: 400 },
      )
    }

    const request = await prisma.facultyVerificationRequest.findUnique({ where: { id } })
    if (!request) {
      return NextResponse.json({ error: 'Verification request not found' }, { status: 404 })
    }

    const newStatus =
      action === 'accept'
        ? FacultyVerificationStatus.ACCEPTED
        : FacultyVerificationStatus.REJECTED

    const updated = await prisma.facultyVerificationRequest.update({
      where: { id },
      data: {
        status: newStatus,
        tokenUsed: true,
        verifiedAt: new Date(),
        overrideBy: session.user.id,
        overrideAt: new Date(),
        overrideReason: overrideReason.trim(),
      },
    })

    // Update teacher-author junction
    const statusValue = action === 'accept' ? 'ACCEPTED' : 'REJECTED'
    const teacherUpdate = { verificationStatus: statusValue as 'ACCEPTED' | 'REJECTED' }

    switch (request.researchType) {
      case 'JOURNAL':
        await prisma.journalTeacherAuthor.updateMany({ where: { journalId: request.researchId, verificationRequestId: id }, data: teacherUpdate })
        break
      case 'BOOK_CHAPTER':
        await prisma.bookChapterTeacherAuthor.updateMany({ where: { bookChapterId: request.researchId, verificationRequestId: id }, data: teacherUpdate })
        break
      case 'CONFERENCE':
        await prisma.conferenceTeacherAuthor.updateMany({ where: { conferenceId: request.researchId, verificationRequestId: id }, data: teacherUpdate })
        break
      case 'PATENT':
        await prisma.patentTeacherAuthor.updateMany({ where: { patentId: request.researchId, verificationRequestId: id }, data: teacherUpdate })
        break
      case 'COPYRIGHT':
        await prisma.copyrightTeacherAuthor.updateMany({ where: { copyrightId: request.researchId, verificationRequestId: id }, data: teacherUpdate })
        break
      case 'GRANT_IN':
        await prisma.grantInTeacherAuthor.updateMany({ where: { grantInId: request.researchId, verificationRequestId: id }, data: teacherUpdate })
        break
    }

    // Notify the student
    await prisma.notification.create({
      data: {
        userId: request.requestedById,
        title: `Faculty Co-Author Verification ${action === 'accept' ? 'Approved' : 'Rejected'} by Admin`,
        message: `An administrator has ${action === 'accept' ? 'approved' : 'rejected'} the co-author verification request for ${request.facultyName}.`,
        type: action === 'accept' ? 'FACULTY_VERIFICATION_ACCEPTED' : 'FACULTY_VERIFICATION_REJECTED',
        link: `/dashboard/${request.researchType.toLowerCase().replace('_', '-')}`,
      },
    }).catch((e) => console.error('[admin-override] Failed to notify student:', e))

    const { verificationToken: _token, ...safeRequest } = updated
    return NextResponse.json({ success: true, request: safeRequest })
  } catch (error) {
    console.error('[POST /api/faculty-verification/[id]/admin-override]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
