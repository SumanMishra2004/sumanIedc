/**
 * POST /api/faculty-verification
 *   Create a new faculty co-author verification request.
 *   Only students can create these requests.
 *
 * GET /api/faculty-verification
 *   - Faculty: returns requests where the supplied email matches their
 *     own account email (i.e., requests directed at them).
 *   - Admin/SuperAdmin: returns all requests (optionally filtered).
 *   - Student: returns requests they created.
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { FacultyVerificationStatus, ResearchType } from '@prisma/client'
import { randomBytes } from 'crypto'
import {
  isAdminOrHigher,
  isFacultyOrHigher,
} from '@/lib/auth/permissions'
import { sendFacultyVerificationEmail } from '@/lib/mail'

const TOKEN_EXPIRY_HOURS = 72 // 3 days

function generateSecureToken(): string {
  return randomBytes(48).toString('hex') // 96-char hex
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — Create a verification request (students only)
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only students can CREATE verification requests
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Only students can create faculty co-author verification requests' },
        { status: 403 },
      )
    }

    const body = await req.json()
    const {
      researchType,
      researchId,
      facultyName,
      facultyEmail,
      institution,
      department,
      designation,
      orcidId,
      affiliation,
    } = body

    // Basic validation
    if (!researchType || !researchId || !facultyName || !facultyEmail) {
      return NextResponse.json(
        { error: 'researchType, researchId, facultyName, and facultyEmail are required' },
        { status: 400 },
      )
    }

    if (!Object.values(ResearchType).includes(researchType as ResearchType)) {
      return NextResponse.json(
        { error: `Invalid researchType. Must be one of: ${Object.values(ResearchType).join(', ')}` },
        { status: 400 },
      )
    }

    // Normalise email
    const normEmail = (facultyEmail as string).toLowerCase().trim()

    // ── Duplicate-prevention ─────────────────────────────────────────────
    // Same research + same faculty email + PENDING = no new request
    const existing = await prisma.facultyVerificationRequest.findFirst({
      where: {
        researchType: researchType as ResearchType,
        researchId,
        facultyEmail: normEmail,
        status: FacultyVerificationStatus.PENDING,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A pending verification request for this faculty member already exists for this submission' },
        { status: 409 },
      )
    }

    // ── Check if faculty already has an account ──────────────────────────
    const existingFaculty = await prisma.user.findUnique({
      where: { email: normEmail },
      select: { id: true, role: true },
    })

    // If the faculty already has an account with faculty or higher role,
    // auto-accept but still create a record for the audit trail.
    const autoAccept = existingFaculty && isFacultyOrHigher(existingFaculty.role)

    // ── Generate secure token ────────────────────────────────────────────
    const verificationToken = generateSecureToken()
    const tokenExpiry = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

    const request = await prisma.facultyVerificationRequest.create({
      data: {
        researchType: researchType as ResearchType,
        researchId,
        facultyName,
        facultyEmail: normEmail,
        institution: institution ?? null,
        department: department ?? null,
        designation: designation ?? null,
        orcidId: orcidId ?? null,
        affiliation: affiliation ?? null,
        verificationToken,
        tokenExpiry,
        status: autoAccept ? FacultyVerificationStatus.ACCEPTED : FacultyVerificationStatus.PENDING,
        tokenUsed: autoAccept ? true : false,
        verifiedAt: autoAccept ? new Date() : null,
        requestedById: session.user.id,
        linkedFacultyId: autoAccept && existingFaculty ? existingFaculty.id : null,
      },
    })

    if (!autoAccept) {
      // Send verification email
      try {
        const domain = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        const verifyUrl = `${domain}/faculty-verification?token=${verificationToken}`
        await sendFacultyVerificationEmail({
          to: normEmail,
          facultyName,
          verifyUrl,
          studentName: session.user.name || 'A student',
          researchType: researchType as string,
          researchId,
          tokenExpiry,
        })
      } catch (emailErr) {
        console.error('[faculty-verification] Failed to send verification email:', emailErr)
        // Don't fail the request — the record is created; email is best-effort
      }

      // Notify the faculty if they have an account (even if role is student)
      if (existingFaculty) {
        await prisma.notification.create({
          data: {
            userId: existingFaculty.id,
            title: 'Faculty Co-Author Verification Request',
            message: `A student has listed you as a co-author on a ${researchType.toLowerCase().replace('_', ' ')}. Please review and verify.`,
            type: 'FACULTY_VERIFICATION_REQUEST',
            link: `/dashboard/faculty/verification-requests`,
          },
        }).catch((e) => console.error('[faculty-verification] Failed to create notification:', e))
      }
    } else {
      // Auto-accepted — notify the requesting student
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          title: 'Faculty Co-Author Verified',
          message: `${facultyName} already has a registered account and their co-authorship has been automatically verified.`,
          type: 'FACULTY_VERIFICATION_ACCEPTED',
          link: `/dashboard/${researchType.toLowerCase().replace('_', '-')}`,
        },
      }).catch((e) => console.error('[faculty-verification] Failed to create notification:', e))
    }

    return NextResponse.json({ request }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/faculty-verification]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — List verification requests
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const researchType = searchParams.get('researchType')
    const researchId = searchParams.get('researchId')

    const where: Record<string, unknown> = {}

    if (status && Object.values(FacultyVerificationStatus).includes(status as FacultyVerificationStatus)) {
      where.status = status as FacultyVerificationStatus
    }
    if (researchType) where.researchType = researchType
    if (researchId) where.researchId = researchId

    if (isAdminOrHigher(session.user.role)) {
      // Admin and SuperAdmin see all requests
    } else if (isFacultyOrHigher(session.user.role)) {
      // Faculty and Editor see requests directed at their email
      where.facultyEmail = session.user.email
    } else {
      // Students see requests they created
      where.requestedById = session.user.id
    }

    const requests = await prisma.facultyVerificationRequest.findMany({
      where,
      include: {
        requestedBy: {
          select: { id: true, name: true, email: true, image: true },
        },
        linkedFaculty: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Strip the verification token from the response for security
    const safeRequests = requests.map(({ verificationToken: _token, ...r }) => r)

    return NextResponse.json({ requests: safeRequests })
  } catch (error) {
    console.error('[GET /api/faculty-verification]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
