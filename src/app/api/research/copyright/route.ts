import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { CopyrightStatus, TeacherStatus, UserRole } from '@prisma/client'
import { copyrightSchema } from '@/lib/validations/copyright'
import { sendNotificationEmail } from '@/lib/mail'
// GET - List all copyrights with filtering, pagination, and search
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
    const copyrightStatus = searchParams.get('copyrightStatus')
    const teacherStatus = searchParams.get('teacherStatus')
    const isPublic = searchParams.get('isPublic')
    const regNo = searchParams.get('regNo')
    const search = searchParams.get('search')

    // Date range filters
    const createdFrom = searchParams.get('createdFrom')
    const createdTo = searchParams.get('createdTo')
    const filingFrom = searchParams.get('filingFrom')
    const filingTo = searchParams.get('filingTo')
    const submissionFrom = searchParams.get('submissionFrom')
    const submissionTo = searchParams.get('submissionTo')
    const publishedFrom = searchParams.get('publishedFrom')
    const publishedTo = searchParams.get('publishedTo')
    const grantFrom = searchParams.get('grantFrom')
    const grantTo = searchParams.get('grantTo')

    // Fee range filters
    const minRegistrationFees = searchParams.get('minRegistrationFees')
    const maxRegistrationFees = searchParams.get('maxRegistrationFees')
    const minReimbursement = searchParams.get('minReimbursement')
    const maxReimbursement = searchParams.get('maxReimbursement')

    // Build where clause
    const where: any = {}

    // Access control based on role
    if (!session) {
      // Not logged in - only public copyrights
      where.isPublic = true
    } else if (session.user.role === UserRole.STUDENT) {
      // Students see: public copyrights OR copyrights where they are authors
      where.OR = [
        { isPublic: true },
        { studentAuthors: { some: { userId: session.user.id } } }
      ]
    } else if (session.user.role === UserRole.FACULTY) {
      // Faculty see: public copyrights OR copyrights where they are authors
      where.OR = [
        { isPublic: true },
        { facultyAuthors: { some: { userId: session.user.id } } }
      ]
    }
    // ADMIN sees everything - no filter needed

    // Apply filters
    if (copyrightStatus) {
      where.copyrightStatus = copyrightStatus as CopyrightStatus
    }

    if (teacherStatus) {
      where.teacherStatus = teacherStatus as TeacherStatus
    }

    if (isPublic !== null && isPublic !== undefined) {
      where.isPublic = isPublic === 'true'
    }

    if (regNo) {
      where.regNo = {
        contains: regNo,
        mode: 'insensitive'
      }
    }

    // Search across multiple fields
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { abstract: { contains: search, mode: 'insensitive' } },
        { regNo: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Date range filters
    if (createdFrom || createdTo) {
      where.createdAt = {}
      if (createdFrom) where.createdAt.gte = new Date(createdFrom)
      if (createdTo) where.createdAt.lte = new Date(createdTo)
    }

    if (filingFrom || filingTo) {
      where.dateOfFiling = {}
      if (filingFrom) where.dateOfFiling.gte = new Date(filingFrom)
      if (filingTo) where.dateOfFiling.lte = new Date(filingTo)
    }

    if (submissionFrom || submissionTo) {
      where.dateOfSubmission = {}
      if (submissionFrom) where.dateOfSubmission.gte = new Date(submissionFrom)
      if (submissionTo) where.dateOfSubmission.lte = new Date(submissionTo)
    }

    if (publishedFrom || publishedTo) {
      where.dateOfPublished = {}
      if (publishedFrom) where.dateOfPublished.gte = new Date(publishedFrom)
      if (publishedTo) where.dateOfPublished.lte = new Date(publishedTo)
    }

    if (grantFrom || grantTo) {
      where.dateOfGrant = {}
      if (grantFrom) where.dateOfGrant.gte = new Date(grantFrom)
      if (grantTo) where.dateOfGrant.lte = new Date(grantTo)
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
    const [copyrights, total] = await Promise.all([
      prisma.copyright.findMany({
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
      prisma.copyright.count({ where })
    ])

    return NextResponse.json({
      copyrights,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching copyrights:', error)
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

    // Students have forced default parameters:
    if (session.user.role === UserRole.STUDENT) {
      body.teacherStatus = TeacherStatus.UPLOADED
      body.copyrightStatus = CopyrightStatus.SUBMITTED
      body.isPublic = false

      // Auto-assign creating student if not present in the payload
      if (!body.studentAuthorIds || body.studentAuthorIds.length === 0) {
        body.studentAuthorIds = [session.user.id]
      } else if (!body.studentAuthorIds.includes(session.user.id)) {
        body.studentAuthorIds.push(session.user.id)
      }
    }

    // Validate request body with Zod
    const validation = copyrightSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message, details: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data

    /* -------------------- Validate faculty authors -------------------- */
    const facultyAuthors = await prisma.user.findMany({
      where: {
        id: { in: data.facultyAuthorIds },
        role: UserRole.FACULTY
      }
    })

    if (facultyAuthors.length !== data.facultyAuthorIds.length) {
      return NextResponse.json(
        { error: "One or more faculty authors are invalid" },
        { status: 400 }
      )
    }

    /* -------------------- Validate student authors -------------------- */
    const studentAuthors = await prisma.user.findMany({
      where: {
        id: { in: data.studentAuthorIds },
        role: UserRole.STUDENT
      }
    })

    if (studentAuthors.length !== data.studentAuthorIds.length) {
      return NextResponse.json(
        { error: "One or more student authors are invalid" },
        { status: 400 }
      )
    }

    /* -------------------- Create Copyright -------------------- */
    const copyright = await prisma.copyright.create({
      data: {
        regNo: data.regNo || "",
        title: data.title,
        abstract: data.abstract,
        imageUrl: data.imageUrl,
        documentUrl: data.documentUrl,
        dateOfFiling: data.dateOfFiling ? new Date(data.dateOfFiling) : null,
        dateOfSubmission: data.dateOfSubmission ? new Date(data.dateOfSubmission) : null,
        dateOfPublished: data.dateOfPublished ? new Date(data.dateOfPublished) : null,
        dateOfGrant: data.dateOfGrant ? new Date(data.dateOfGrant) : null,
        registrationFees: data.registrationFees !== undefined ? Number(data.registrationFees) : null,
        reimbursement: data.reimbursement !== undefined ? Number(data.reimbursement) : null,
        copyrightStatus: data.copyrightStatus ?? CopyrightStatus.SUBMITTED,
        teacherStatus: data.teacherStatus ?? TeacherStatus.UPLOADED,
        isPublic: Boolean(data.isPublic),

        studentAuthors: {
          create: data.studentAuthorIds.map((userId: string) => ({
            userId
          }))
        },

        facultyAuthors: {
          create: data.facultyAuthorIds.map((userId: string) => ({
            userId
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

    // Notify faculty authors (co-authors / reviewers)
    for (const fa of copyright.facultyAuthors) {
      try {
        await prisma.notification.create({
          data: {
            userId: fa.userId,
            title: "Co-authored Copyright Submitted",
            message: `A new co-authored copyright '${copyright.title}' has been submitted for review.`,
            type: "COPYRIGHT_SUBMITTED",
            link: `/dashboard/copyright?id=${copyright.id}`,
          },
        })

        if (fa.user.email) {
          await sendNotificationEmail({
            to: fa.user.email,
            recipientName: fa.user.name || "Faculty",
            type: "SUBMITTED",
            resourceType: "copyright",
            resourceTitle: copyright.title,
            dashboardLink: `/dashboard/copyright?id=${copyright.id}`,
            submittedBy: session.user.name || "A team member",
          }).catch(err => console.error("[Email] Failed to send SUBMITTED email to faculty author:", err))
        }
      } catch (err) {
        console.error("Failed to create notification for faculty author", fa.userId, err)
      }
    }

    return NextResponse.json(
      { copyright },
      { status: 201 }
    )

  } catch (error) {
    console.error("Copyright POST error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Bulk delete copyrights
export async function DELETE(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role === UserRole.STUDENT) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin or Faculty access required' },
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

    // Delete copyrights (cascade will handle authors)
    const result = await prisma.copyright.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    return NextResponse.json({
      message: `Successfully deleted ${result.count} copyright(s)`,
      count: result.count
    })
  } catch (error) {
    console.error('Error deleting copyrights:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
