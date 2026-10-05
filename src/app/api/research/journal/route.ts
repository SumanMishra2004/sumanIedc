import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import {
  TeacherStatus,
  JournalStatus,
  JournalScope,
  JournalIndexing,
  JournalQuartile,
  JournalFacultyRole,
} from '@prisma/client'
import {
  getJournalQueryFilter,
  canViewJournal,
  generateJournalSerialNo,
  getNotificationRecipients,
  createNotificationMessage,
  getJournalWithAuthors,
} from '@/lib/research/journalHelpers'

// ─── GET - List journals with filters and pagination ─────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user } = session
    const searchParams = req.nextUrl.searchParams

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Filters
    const teacherStatus = searchParams.get('teacherStatus')
    const journalStatus = searchParams.get('journalStatus')
    const indexing = searchParams.get('indexing')
    const quartile = searchParams.get('quartile')
    const scope = searchParams.get('scope')
    const search = searchParams.get('search')
    const isPublic = searchParams.get('isPublic')

    // Build where clause based on user role
    const baseFilter = getJournalQueryFilter(user.id, user.role)
    const where: any = { ...baseFilter }

    // Apply enum filters
    if (teacherStatus && Object.values(TeacherStatus).includes(teacherStatus as TeacherStatus)) {
      where.teacherStatus = teacherStatus as TeacherStatus
    }

    if (journalStatus && Object.values(JournalStatus).includes(journalStatus as JournalStatus)) {
      where.journalStatus = journalStatus as JournalStatus
    }

    if (indexing && Object.values(JournalIndexing).includes(indexing as JournalIndexing)) {
      where.indexing = indexing as JournalIndexing
    }

    if (quartile && Object.values(JournalQuartile).includes(quartile as JournalQuartile)) {
      where.quartile = quartile as JournalQuartile
    }

    if (scope && Object.values(JournalScope).includes(scope as JournalScope)) {
      where.scope = scope as JournalScope
    }

    if (isPublic !== null && isPublic !== undefined && isPublic !== '') {
      where.isPublic = isPublic === 'true'
    }

    // Search across multiple fields
    if (search) {
      const searchConditions = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { journalName: { contains: search, mode: 'insensitive' as const } },
        { abstract: { contains: search, mode: 'insensitive' as const } },
        { publisher: { contains: search, mode: 'insensitive' as const } },
        { doi: { contains: search, mode: 'insensitive' as const } },
        { serialNo: { contains: search, mode: 'insensitive' as const } },
      ]

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }]
        delete where.OR
      } else {
        where.OR = searchConditions
      }
    }

    // Fetch data with pagination
    const [journals, total] = await Promise.all([
      prisma.journal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          studentAuthors: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  department: true,
                },
              },
            },
          },
          facultyAuthors: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  department: true,
                },
              },
            },
          },
        },
      }),
      prisma.journal.count({ where }),
    ])

    return NextResponse.json({
      journals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching journals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST - Create a new journal ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user } = session
    const body = await req.json()

    // Validate user can create journal (STUDENT or FACULTY)
    if (!['STUDENT', 'FACULTY'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Only students and faculty can create journals' },
        { status: 403 }
      )
    }

    const {
      serialNo: providedSerialNo,
      title,
      journalName,
      abstract,
      scope,
      reviewType,
      accessType,
      indexing,
      quartile,
      publicationMode,
      impactFactor,
      impactFactorDate,
      publisher,
      publicationDate,
      doi,
      paperLink,
      keywords,
      registrationFees,
      reimbursement,
      imageUrl,
      documentUrl,
      studentAuthorIds,
      facultyAuthorIds,
      principalInvestigatorId,
      externalFacultyAuthors = [],
      externalStudentAuthors = [],
    } = body

    // Generate or use provided serial number
    const serialNo = providedSerialNo || (await generateJournalSerialNo())

    // Validation: Ensure we have required fields
    if (!title || !journalName || !documentUrl) {
      return NextResponse.json(
        { error: 'Title, journal name, and document are required' },
        { status: 400 }
      )
    }

    // Determine initial status and authorship based on creator role
    let initialTeacherStatus = TeacherStatus.UPLOADED
    let finalStudentAuthorIds: string[] = studentAuthorIds || []
    let finalFacultyAuthorIds: string[] = facultyAuthorIds || []
    let piId: string | null = principalInvestigatorId || null

    if (user.role === 'FACULTY') {
      // Faculty creates: they are PI by default
      if (!finalFacultyAuthorIds.includes(user.id)) {
        finalFacultyAuthorIds.push(user.id)
      }
      piId = user.id
    } else if (user.role === 'STUDENT') {
      // Student creates: must select a PI from platform faculty OR add at least one external faculty
      const hasExternalFaculty = Array.isArray(externalFacultyAuthors) && externalFacultyAuthors.length > 0
      if (!piId && !hasExternalFaculty) {
        return NextResponse.json(
          { error: 'Students must select a faculty member as Principal Investigator or add at least one external faculty author' },
          { status: 400 }
        )
      }

      if (piId) {
        // Verify PI is a faculty member
        const piUser = await prisma.user.findUnique({
          where: { id: piId },
          select: { role: true },
        })

        if (!piUser || !['FACULTY', 'ADMIN', 'SUPERADMIN'].includes(piUser.role)) {
          return NextResponse.json(
            { error: 'Principal Investigator must be a faculty member' },
            { status: 400 }
          )
        }

        // Add PI to faculty authors if not already there
        if (!finalFacultyAuthorIds.includes(piId)) {
          finalFacultyAuthorIds.push(piId)
        }
      }

      // Add student creator to student authors
      if (!finalStudentAuthorIds.includes(user.id)) {
        finalStudentAuthorIds.push(user.id)
      }
    }

    // Create journal with authors
    const journal = await prisma.journal.create({
      data: {
        serialNo,
        title,
        journalName,
        abstract: abstract || null,
        scope,
        reviewType,
        accessType,
        indexing,
        quartile: quartile || JournalQuartile.NOT_APPLICABLE,
        publicationMode,
        impactFactor: impactFactor || null,
        impactFactorDate: impactFactorDate ? new Date(impactFactorDate) : null,
        publisher: publisher || null,
        publicationDate: publicationDate ? new Date(publicationDate) : null,
        doi: doi || null,
        paperLink: paperLink || null,
        keywords: keywords || [],
        registrationFees: registrationFees || null,
        reimbursement: reimbursement || null,
        imageUrl: imageUrl || null,
        documentUrl,
        teacherStatus: initialTeacherStatus,
        journalStatus: JournalStatus.SUBMITTED,
        isPublic: false,
        studentAuthors: {
          create: finalStudentAuthorIds.map((id) => ({ userId: id })),
        },
        facultyAuthors: {
          create: finalFacultyAuthorIds.map((id) => ({
            userId: id,
            role: id === piId ? JournalFacultyRole.PI : JournalFacultyRole.CO_PI,
          })),
        },
      },
      include: {
        studentAuthors: { include: { user: true } },
        facultyAuthors: { include: { user: true } },
      },
    })

    // Send notification to PI (if not the creator)
    if (piId && piId !== user.id) {
      const notificationData = {
        journalId: journal.id,
        journalTitle: journal.title,
        actionType: 'submitted' as const,
        actorName: user.name || user.email || 'A user',
      }

      const recipients = getNotificationRecipients(
        journal as any,
        'submitted',
        user.id
      )
      const notification = createNotificationMessage(notificationData)

      await Promise.all(
        recipients.map((recipientId) =>
          prisma.notification.create({
            data: {
              userId: recipientId,
              title: notification.title,
              message: notification.message,
              type: notification.type,
              link: notification.link,
            },
          })
        )
      )
    }

    // ── External faculty: create FacultyVerificationRequest + JournalTeacherAuthor ──
    type ExternalAuthorInput = {
      name: string
      email: string
      affiliation?: string | null
      department?: string | null
    }

    for (const ext of (externalFacultyAuthors as ExternalAuthorInput[])) {
      try {
        const normEmail = ext.email.toLowerCase().trim()

        // Check if this external faculty already has a registered account
        const existingUser = await prisma.user.findUnique({
          where: { email: normEmail },
          select: { id: true, role: true },
        })
        const autoAccept =
          existingUser &&
          ['FACULTY', 'EDITOR', 'ADMIN', 'SUPERADMIN'].includes(existingUser.role)

        const { randomBytes } = await import('crypto')
        const verificationToken = randomBytes(48).toString('hex')
        const tokenExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 h

        const verificationRequest = await prisma.facultyVerificationRequest.create({
          data: {
            researchType: 'JOURNAL',
            researchId: journal.id,
            facultyName: ext.name,
            facultyEmail: normEmail,
            affiliation: ext.affiliation ?? null,
            department: ext.department ?? null,
            verificationToken,
            tokenExpiry,
            status: autoAccept ? 'ACCEPTED' : 'PENDING',
            tokenUsed: autoAccept ? true : false,
            verifiedAt: autoAccept ? new Date() : null,
            requestedById: session.user.id,
            linkedFacultyId: autoAccept && existingUser ? existingUser.id : null,
          },
        })

        // Create an unlisted JournalTeacherAuthor row linked to the verification request
        await prisma.journalTeacherAuthor.create({
          data: {
            journalId: journal.id,
            userId: autoAccept && existingUser ? existingUser.id : null,
            role: JournalFacultyRole.CO_PI,
            verificationStatus: autoAccept ? 'ACCEPTED' : 'PENDING',
            verificationRequestId: verificationRequest.id,
          },
        })

        if (!autoAccept) {
          const { sendFacultyVerificationEmail } = await import('@/lib/mail')
          const domain = process.env.NEXTAUTH_URL || 'http://localhost:3000'
          const verifyUrl = `${domain}/faculty-verification?token=${verificationToken}`
          await sendFacultyVerificationEmail({
            to: normEmail,
            facultyName: ext.name,
            verifyUrl,
            studentName: session.user.name || 'A user',
            researchType: 'JOURNAL',
            researchId: journal.id,
            tokenExpiry,
          }).catch((err) =>
            console.error('[Journal] Failed to send verification email to external faculty:', err)
          )
        }
      } catch (err) {
        console.error('[Journal] Failed to process external faculty author:', err)
      }
    }

    // ── External students: log for future use ────────────────────────────────
    // External student authors are recorded on the client side (in the form)
    // but the JournalStudentAuthor table requires a platform userId.
    // A future migration can store them in a dedicated JSON/text column.
    // For now we log so admins are aware.
    if ((externalStudentAuthors as ExternalAuthorInput[]).length > 0) {
      console.info(
        `[Journal] ${(externalStudentAuthors as ExternalAuthorInput[]).length} external student author(s) listed for journal ${journal.id} — not persisted (no userId).`
      )
    }

    return NextResponse.json({ journal }, { status: 201 })
  } catch (error) {
    console.error('Error creating journal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE - Bulk delete journals ───────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user } = session
    const body = await req.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Journal IDs are required' }, { status: 400 })
    }

    // Only ADMIN and SUPERADMIN can bulk delete
    if (!['ADMIN', 'SUPERADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Only admins can bulk delete journals' },
        { status: 403 }
      )
    }

    // Delete journals
    const result = await prisma.journal.deleteMany({
      where: {
        id: { in: ids },
      },
    })

    return NextResponse.json({
      message: `Successfully deleted ${result.count} journal(s)`,
      count: result.count,
    })
  } catch (error) {
    console.error('Error bulk deleting journals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
