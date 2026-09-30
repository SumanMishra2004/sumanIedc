import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { BookchapterStatus, TeacherStatus, UserRole } from '@prisma/client'
import { bookChapterSchema } from '@/lib/validations/book-chapter'
import { sendNotificationEmail } from '@/lib/mail'
import { canViewAllResearch, isFacultyAuthorRole } from '@/lib/auth/permissions'
// GET - List all book chapters with filtering, pagination, and search
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const searchParams = req.nextUrl.searchParams

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Filters
    const bookChapterStatus = searchParams.get('bookChapterStatus')
    const teacherStatus = searchParams.get('teacherStatus')
    const isPublic = searchParams.get('isPublic')
    const keyword = searchParams.get('keyword')
    const publisher = searchParams.get('publisher')
    const search = searchParams.get('search')

    // Date range filters
    const createdFrom = searchParams.get('createdFrom')
    const createdTo = searchParams.get('createdTo')
    const publishedFrom = searchParams.get('publishedFrom')
    const publishedTo = searchParams.get('publishedTo')

    // Fee range filters
    const minRegistrationFees = searchParams.get('minRegistrationFees')
    const maxRegistrationFees = searchParams.get('maxRegistrationFees')
    const minReimbursement = searchParams.get('minReimbursement')
    const maxReimbursement = searchParams.get('maxReimbursement')

    // Build where clause
    const where: any = {}

    // Access control based on role
    if (!session) {
      // Not logged in - only public chapters
      where.isPublic = true
    } else if (canViewAllResearch(session.user.role)) {
      // EDITOR / ADMIN / SUPERADMIN — no filter, sees everything
    } else if (session.user.role === UserRole.FACULTY) {
      where.OR = [
        { facultyAuthors: { some: { userId: session.user.id } } }
      ]
    } else {
      // STUDENT
      where.OR = [
        { studentAuthors: { some: { userId: session.user.id } } }
      ]
    }

    // Apply filters
    if (bookChapterStatus) {
      where.bookChapterStatus = bookChapterStatus as BookchapterStatus
    }

    if (teacherStatus) {
      where.teacherStatus = teacherStatus as TeacherStatus
    }

    if (isPublic !== null && isPublic !== undefined) {
      where.isPublic = isPublic === 'true'
    }

    if (keyword) {
      where.keywords = {
        has: keyword
      }
    }

    if (publisher) {
      where.publisher = {
        contains: publisher,
        mode: 'insensitive'
      }
    }
if (search) {
  where.AND = [
    ...(where.AND || []),
    {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { abstract: { contains: search, mode: 'insensitive' } },
        { publisher: { contains: search, mode: 'insensitive' } },
        { isbnIssn: { contains: search, mode: 'insensitive' } },
        { doi: { contains: search, mode: 'insensitive' } }
      ]
    }
  ]
}

    // Date range filters
    if (createdFrom || createdTo) {
      where.createdAt = {}
      if (createdFrom) where.createdAt.gte = new Date(createdFrom)
      if (createdTo) where.createdAt.lte = new Date(createdTo)
    }

    if (publishedFrom || publishedTo) {
      where.publicationDate = {}
      if (publishedFrom) where.publicationDate.gte = new Date(publishedFrom)
      if (publishedTo) where.publicationDate.lte = new Date(publishedTo)
    }

    // Fee range filters
    if (minRegistrationFees || maxRegistrationFees) {
      where.registrationFees = {}
      if (minRegistrationFees) where.registrationFees.gte = parseFloat(minRegistrationFees)
      if (maxRegistrationFees) where.registrationFees.lte = parseFloat(maxRegistrationFees)
    }

    if (minReimbursement || maxReimbursement) {
      where.reimbursement = {}
      if (minReimbursement) where.reimbursement.gte = parseFloat(minReimbursement)
      if (maxReimbursement) where.reimbursement.lte = parseFloat(maxReimbursement)
    }

    // Fetch data with pagination
    const [bookChapters, total] = await Promise.all([
      prisma.bookChapter.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder
        },
        include: {
          studentAuthors: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true
                }
              }
            }
          },
          facultyAuthors: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true
                }
              }
            }
          }
        }
      }),
      prisma.bookChapter.count({ where })
    ])

    return NextResponse.json({
      bookChapters,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching book chapters:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Enforce validation using Zod
    const validation = bookChapterSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message, details: validation.error.issues },
        { status: 400 }
      )
    }

    const {
      title,
      abstract,
      imageUrl,
      documentUrl,
      bookChapterStatus,
      isbnIssn,
      registrationFees,
      reimbursement,
      isPublic,
      keywords,
      doi,
      publicationDate,
      publisher,
      studentAuthorIds,
      facultyAuthorIds,
      externalFacultyAuthors = [],
      externalStudentAuthors = [],
    } = validation.data

    /* -------------------- Validate faculty authors -------------------- */
    const facultyAuthors = await prisma.user.findMany({
      where: {
        id: { in: facultyAuthorIds },
        role: { in: ['FACULTY', 'EDITOR', 'ADMIN', 'SUPERADMIN'] as UserRole[] },
      }
    })

    if (facultyAuthors.length !== facultyAuthorIds.length) {
      return NextResponse.json(
        { error: "One or more faculty authors are invalid" },
        { status: 400 }
      )
    }

    /* -------------------- Validate student authors -------------------- */
    const studentAuthors = await prisma.user.findMany({
      where: {
        id: { in: studentAuthorIds },
        role: UserRole.STUDENT,
      }
    })

    if (studentAuthors.length !== studentAuthorIds.length) {
      return NextResponse.json(
        { error: "One or more student authors are invalid" },
        { status: 400 }
      )
    }

    /* -------------------- Create BookChapter -------------------- */
    const bookChapter = await prisma.bookChapter.create({
      data: {
        title,
        abstract,
        imageUrl,
        documentUrl,
        bookChapterStatus: bookChapterStatus ?? BookchapterStatus.SUBMITTED,
        isbnIssn,
        registrationFees,
        reimbursement,
        isPublic,
        keywords,
        doi,
        publicationDate: publicationDate ? new Date(publicationDate) : null,
        publisher,
        studentAuthors: {
          create: studentAuthorIds.map((userId: string) => ({
            userId
          }))
        },
        facultyAuthors: {
          create: facultyAuthorIds.map((userId: string) => ({
            userId,
            verificationStatus: 'ACCEPTED',
          }))
        }
      },
      include: {
        studentAuthors: {
          include: { user: true }
        },
        facultyAuthors: {
          include: { user: true }
        }
      }
    })

    /* -------------------- External faculty: create verification requests -------------------- */
    for (const ext of externalFacultyAuthors) {
      try {
        const normEmail = ext.email.toLowerCase().trim()

        // Check if this external faculty already has an account
        const existingUser = await prisma.user.findUnique({
          where: { email: normEmail },
          select: { id: true, role: true },
        })
        const autoAccept = existingUser &&
          ['FACULTY', 'EDITOR', 'ADMIN', 'SUPERADMIN'].includes(existingUser.role)

        const crypto = await import('crypto')
        const verificationToken = crypto.randomBytes(48).toString('hex')
        const tokenExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000)

        const verificationRequest = await prisma.facultyVerificationRequest.create({
          data: {
            researchType: 'BOOK_CHAPTER',
            researchId: bookChapter.id,
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

        // Add unlisted faculty author row linked to the verification request
        await prisma.bookChapterTeacherAuthor.create({
          data: {
            bookChapterId: bookChapter.id,
            userId: autoAccept && existingUser ? existingUser.id : null,
            verificationStatus: autoAccept ? 'ACCEPTED' : 'PENDING',
            verificationRequestId: verificationRequest.id,
          },
        })

        if (!autoAccept) {
          // Send verification email
          const { sendFacultyVerificationEmail } = await import('@/lib/mail')
          const domain = process.env.NEXTAUTH_URL || 'http://localhost:3000'
          const verifyUrl = `${domain}/faculty-verification?token=${verificationToken}`
          await sendFacultyVerificationEmail({
            to: normEmail,
            facultyName: ext.name,
            verifyUrl,
            studentName: session.user.name || 'A student',
            researchType: 'BOOK_CHAPTER',
            researchId: bookChapter.id,
            tokenExpiry,
          }).catch(err => console.error('[BookChapter] Failed to send verification email:', err))
        }
      } catch (err) {
        console.error('[BookChapter] Failed to process external faculty author:', err)
      }
    }

    /* -------------------- External students: store as unlisted student rows -------------------- */
    // External students are stored for display purposes; they are not platform users.
    // We store them in the verification request table so admin can see them, but they
    // do not get a StudentAuthor row (which requires a userId).
    // Instead we send them a simple notification email if desired.
    // For now we just log; a future migration can add an externalStudentAuthors JSON column.

    /* -------------------- Notify platform faculty co-authors -------------------- */
    for (const faculty of facultyAuthors) {
      try {
        await prisma.notification.create({
          data: {
            userId: faculty.id,
            title: "New Book Chapter Co-Authored",
            message: `A new book chapter submission '${bookChapter.title}' has been uploaded and lists you as co-author.`,
            type: "BOOK_CHAPTER_SUBMITTED",
            link: `/dashboard/book-chapters?id=${bookChapter.id}`,
          }
        })

        if (faculty.email) {
          await sendNotificationEmail({
            to: faculty.email,
            recipientName: faculty.name || "Faculty",
            type: "SUBMITTED",
            resourceType: "book-chapter",
            resourceTitle: bookChapter.title,
            dashboardLink: `/dashboard/book-chapters?id=${bookChapter.id}`,
            submittedBy: session.user.name || "A team member",
          }).catch(err => console.error("[Email] Failed to send SUBMITTED email to faculty author:", err))
        }
      } catch (err) {
        console.error("Failed to notify faculty co-author:", err)
      }
    }

    return NextResponse.json(
      { bookChapter },
      { status: 201 }
    )

  } catch (error) {
    console.error("BookChapter POST error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Bulk delete book chapters
export async function DELETE(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role === UserRole.STUDENT) {
      return NextResponse.json(
        { error: 'Unauthorized - Editor or Faculty access required' },
        { status: 403 }
      )
    }

    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs array is required' },
        { status: 400 }
      )
    }

    // Delete book chapters (cascade will handle authors)
    const result = await prisma.bookChapter.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    return NextResponse.json({
      message: `Successfully deleted ${result.count} book chapter(s)`,
      count: result.count
    })
  } catch (error) {
    console.error('Error deleting book chapters:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
