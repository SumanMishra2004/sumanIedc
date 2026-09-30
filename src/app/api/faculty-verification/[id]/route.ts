/**
 * GET /api/faculty-verification/[id]
 *   Fetch a single verification request (admin, faculty owner, or the student who created it).
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { isAdminOrHigher, isFacultyOrHigher } from '@/lib/auth/permissions'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const request = await prisma.facultyVerificationRequest.findUnique({
      where: { id },
      include: {
        requestedBy: { select: { id: true, name: true, email: true, image: true } },
        linkedFaculty: { select: { id: true, name: true, email: true, image: true } },
      },
    })

    if (!request) {
      return NextResponse.json({ error: 'Verification request not found' }, { status: 404 })
    }

    // Access control
    const isAdmin = isAdminOrHigher(session.user.role)
    const isFaculty = isFacultyOrHigher(session.user.role)
    const isFacultyOwner = isFaculty && request.facultyEmail === session.user.email
    const isRequester = request.requestedById === session.user.id

    if (!isAdmin && !isFacultyOwner && !isRequester) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Strip token from response
    const { verificationToken: _token, ...safeRequest } = request
    return NextResponse.json({ request: safeRequest })
  } catch (error) {
    console.error('[GET /api/faculty-verification/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
