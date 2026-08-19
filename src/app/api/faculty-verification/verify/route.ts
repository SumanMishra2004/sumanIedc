/**
 * GET /api/faculty-verification/verify?token=<token>
 *
 * Secure token-based verification endpoint.
 * Faculty members who receive the verification email click a link that hits
 * this endpoint with their unique token.  The response is JSON so the
 * front-end page (/faculty-verification) can use it to show the correct UI.
 *
 * Security guarantees:
 *  - Token is cryptographically random (96 hex chars).
 *  - Token has an expiry (72 hours).
 *  - Token is single-use (tokenUsed flag).
 *  - Specific to one research record + one faculty-email pair.
 *  - Does NOT automatically accept — it only validates the token and returns
 *    the request metadata.  The faculty must explicitly POST to /accept.
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { FacultyVerificationStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')

    if (!token || token.length < 64) {
      return NextResponse.json({ error: 'Invalid or missing token' }, { status: 400 })
    }

    const request = await prisma.facultyVerificationRequest.findUnique({
      where: { verificationToken: token },
      select: {
        id: true,
        researchType: true,
        researchId: true,
        facultyName: true,
        facultyEmail: true,
        institution: true,
        department: true,
        designation: true,
        orcidId: true,
        affiliation: true,
        status: true,
        tokenUsed: true,
        tokenExpiry: true,
        createdAt: true,
        requestedBy: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    })

    if (!request) {
      return NextResponse.json(
        { error: 'Verification token not found', code: 'TOKEN_NOT_FOUND' },
        { status: 404 },
      )
    }

    if (request.tokenUsed) {
      return NextResponse.json(
        {
          error: 'This verification link has already been used',
          code: 'TOKEN_ALREADY_USED',
          status: request.status,
          request,
        },
        { status: 410 },
      )
    }

    if (new Date() > request.tokenExpiry) {
      return NextResponse.json(
        {
          error: 'This verification link has expired',
          code: 'TOKEN_EXPIRED',
          request,
        },
        { status: 410 },
      )
    }

    if (request.status !== FacultyVerificationStatus.PENDING) {
      return NextResponse.json(
        {
          error: `This request has already been ${request.status.toLowerCase()}`,
          code: 'REQUEST_RESOLVED',
          status: request.status,
          request,
        },
        { status: 409 },
      )
    }

    // Valid token — return request details so the UI can prompt accept/reject
    return NextResponse.json({ valid: true, request })
  } catch (error) {
    console.error('[GET /api/faculty-verification/verify]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/faculty-verification/verify
 *
 * Accept or reject via a verification token (no login required).
 * This is the unauthenticated path for faculty who receive the email but
 * don't have an account yet.
 *
 * Body: { token: string, action: "accept" | "reject", rejectionReason?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, action, rejectionReason } = body

    if (!token || !action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'token and action (accept|reject) are required' },
        { status: 400 },
      )
    }

    const request = await prisma.facultyVerificationRequest.findUnique({
      where: { verificationToken: token },
    })

    if (!request) {
      return NextResponse.json({ error: 'Invalid token', code: 'TOKEN_NOT_FOUND' }, { status: 404 })
    }

    if (request.tokenUsed) {
      return NextResponse.json(
        { error: 'Token already used', code: 'TOKEN_ALREADY_USED', status: request.status },
        { status: 410 },
      )
    }

    if (new Date() > request.tokenExpiry) {
      return NextResponse.json(
        { error: 'Token has expired', code: 'TOKEN_EXPIRED' },
        { status: 410 },
      )
    }

    if (request.status !== FacultyVerificationStatus.PENDING) {
      return NextResponse.json(
        { error: `Request already ${request.status}`, code: 'REQUEST_RESOLVED', status: request.status },
        { status: 409 },
      )
    }

    const newStatus =
      action === 'accept'
        ? FacultyVerificationStatus.ACCEPTED
        : FacultyVerificationStatus.REJECTED

    // Check if faculty has an account for linking
    const facultyUser = await prisma.user.findUnique({
      where: { email: request.facultyEmail },
      select: { id: true },
    })

    const updated = await prisma.facultyVerificationRequest.update({
      where: { id: request.id },
      data: {
        status: newStatus,
        tokenUsed: true,
        verifiedAt: new Date(),
        rejectionReason: action === 'reject' ? (rejectionReason ?? null) : null,
        linkedFacultyId: action === 'accept' && facultyUser ? facultyUser.id : null,
      },
    })

    // Update teacher-author junction records
    const statusValue = action === 'accept' ? 'ACCEPTED' : 'REJECTED'
    const teacherUpdate = {
      verificationStatus: statusValue as 'ACCEPTED' | 'REJECTED',
      ...(action === 'accept' && facultyUser ? { userId: facultyUser.id } : {}),
    }

    switch (request.researchType) {
      case 'JOURNAL':
        await prisma.journalTeacherAuthor.updateMany({ where: { journalId: request.researchId, verificationRequestId: request.id }, data: teacherUpdate })
        break
      case 'BOOK_CHAPTER':
        await prisma.bookChapterTeacherAuthor.updateMany({ where: { bookChapterId: request.researchId, verificationRequestId: request.id }, data: teacherUpdate })
        break
      case 'CONFERENCE':
        await prisma.conferenceTeacherAuthor.updateMany({ where: { conferenceId: request.researchId, verificationRequestId: request.id }, data: teacherUpdate })
        break
      case 'PATENT':
        await prisma.patentTeacherAuthor.updateMany({ where: { patentId: request.researchId, verificationRequestId: request.id }, data: teacherUpdate })
        break
      case 'COPYRIGHT':
        await prisma.copyrightTeacherAuthor.updateMany({ where: { copyrightId: request.researchId, verificationRequestId: request.id }, data: teacherUpdate })
        break
      case 'GRANT_IN':
        await prisma.grantInTeacherAuthor.updateMany({ where: { grantInId: request.researchId, verificationRequestId: request.id }, data: teacherUpdate })
        break
    }

    // Notify the requesting student
    await prisma.notification.create({
      data: {
        userId: request.requestedById,
        title: action === 'accept' ? 'Faculty Co-Author Verified' : 'Faculty Co-Author Verification Rejected',
        message:
          action === 'accept'
            ? `${request.facultyName} has accepted your co-author verification request.`
            : `${request.facultyName} has rejected your co-author verification request.${
                rejectionReason ? ` Reason: ${rejectionReason}` : ''
              }`,
        type: action === 'accept' ? 'FACULTY_VERIFICATION_ACCEPTED' : 'FACULTY_VERIFICATION_REJECTED',
        link: `/dashboard/${request.researchType.toLowerCase().replace('_', '-')}`,
      },
    }).catch((e) => console.error('[verify POST] Failed to notify student:', e))

    const { verificationToken: _token, ...safeRequest } = updated
    return NextResponse.json({
      success: true,
      action,
      request: safeRequest,
    })
  } catch (error) {
    console.error('[POST /api/faculty-verification/verify]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
