import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { CopyrightStatus, TeacherStatus, UserRole } from '@prisma/client'

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

    const {
      regNo,
      title,
      abstract,
      imageUrl,
      documentUrl,
      dateOfFiling,
      dateOfSubmission,
      dateOfPublished,
      dateOfGrant,
      registrationFees,
      reimbursement,
      copyrightStatus,
      teacherStatus,
      isPublic,
      studentAuthorIds = [],
      facultyAuthorIds = []
    } = body

    /* -------------------- Basic validation -------------------- */

    if (!regNo || typeof regNo !== "string") {
      return NextResponse.json(
        { error: "Registration number is required" },
        { status: 400 }
      )
    }

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    if (!Array.isArray(facultyAuthorIds) || facultyAuthorIds.length === 0) {
      return NextResponse.json(
        { error: "At least one faculty author is required" },
        { status: 400 }
      )
    }
    if (!Array.isArray(studentAuthorIds) || studentAuthorIds.length === 0) {
      return NextResponse.json(
        { error: "At least one student author is required" },
        { status: 400 }
      )
    }

    if (copyrightStatus && !Object.values(CopyrightStatus).includes(copyrightStatus)) {
      return NextResponse.json(
        { error: "Invalid copyright status" },
        { status: 400 }
      )
    }

    if (teacherStatus && !Object.values(TeacherStatus).includes(teacherStatus)) {
      return NextResponse.json(
        { error: "Invalid teacher status" },
        { status: 400 }
      )
    }

    /* -------------------- Validate faculty authors -------------------- */

    const facultyAuthors = await prisma.user.findMany({
      where: {
        id: { in: facultyAuthorIds },
        role: UserRole.FACULTY
      }
    })

    if (facultyAuthors.length !== facultyAuthorIds.length) {
      return NextResponse.json(
        { error: "One or more faculty authors are invalid" },
        { status: 400 }
      )
    }

    /* -------------------- Validate student authors -------------------- */

    if (studentAuthorIds.length > 0) {
      const studentAuthors = await prisma.user.findMany({
        where: {
          id: { in: studentAuthorIds },
          role: UserRole.STUDENT
        }
      })

      if (studentAuthors.length !== studentAuthorIds.length) {
        return NextResponse.json(
          { error: "One or more student authors are invalid" },
          { status: 400 }
        )
      }
    }

    /* -------------------- Create Copyright -------------------- */

    const copyright = await prisma.copyright.create({
      data: {
        regNo,
        title,
        abstract,
        imageUrl,
        documentUrl,
        dateOfFiling: dateOfFiling ? new Date(dateOfFiling) : null,
        dateOfSubmission: dateOfSubmission ? new Date(dateOfSubmission) : null,
        dateOfPublished: dateOfPublished ? new Date(dateOfPublished) : null,
        dateOfGrant: dateOfGrant ? new Date(dateOfGrant) : null,
        registrationFees:
          registrationFees !== undefined ? Number(registrationFees) : null,
        reimbursement:
          reimbursement !== undefined ? Number(reimbursement) : null,
        copyrightStatus: copyrightStatus ?? CopyrightStatus.SUBMITTED,
        teacherStatus: teacherStatus ?? TeacherStatus.UPLOADED,
        isPublic: Boolean(isPublic),

        studentAuthors: {
          create: studentAuthorIds.map((userId: string) => ({
            userId
          }))
        },

        facultyAuthors: {
          create: facultyAuthorIds.map((userId: string) => ({
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
