import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { BookchapterStatus, TeacherStatus, UserRole } from '@prisma/client'

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
    } else if (session.user.role === UserRole.STUDENT) {
      // Students see: public chapters OR chapters where they are authors
      where.OR = [
        
        { studentAuthors: { some: { userId: session.user.id } } }
      ]
    } else if (session.user.role === UserRole.FACULTY) {
      // Faculty see: public chapters OR chapters where they are authors
      where.OR = [

        { facultyAuthors: { some: { userId: session.user.id } } }
      ]
    }
    // ADMIN sees everything - no filter needed

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

    // Search across multiple fields
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { abstract: { contains: search, mode: 'insensitive' } },
        { publisher: { contains: search, mode: 'insensitive' } },
        { isbnIssn: { contains: search, mode: 'insensitive' } },
        { doi: { contains: search, mode: 'insensitive' } }
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

    const {
      title,
      abstract,
      imageUrl,
      documentUrl,
      bookChapterStatus,
      teacherStatus,
      isbnIssn,
      registrationFees,
      reimbursement,
      isPublic,
      keywords,
      doi,
      publicationDate,
      publisher,
      studentAuthorIds = [],
      facultyAuthorIds = []
    } = body

    /* -------------------- Basic validation -------------------- */

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

    if (keywords && !Array.isArray(keywords)) {
      return NextResponse.json(
        { error: "Keywords must be an array of strings" },
        { status: 400 }
      )
    }

    if (bookChapterStatus && !Object.values(BookchapterStatus).includes(bookChapterStatus)) {
      return NextResponse.json(
        { error: "Invalid book chapter status" },
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

    /* -------------------- Validate student authors (optional) -------------------- */

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

    /* -------------------- Create BookChapter -------------------- */

    const bookChapter = await prisma.bookChapter.create({
      data: {
        title,
        abstract,
        imageUrl,
        documentUrl,
        bookChapterStatus: bookChapterStatus ?? BookchapterStatus.SUBMITTED,
        teacherStatus: teacherStatus ?? TeacherStatus.UPLOADED,
        isbnIssn,
        registrationFees:
          registrationFees !== undefined ? Number(registrationFees) : null,
        reimbursement:
          reimbursement !== undefined ? Number(reimbursement) : null,
        isPublic: Boolean(isPublic),
        keywords: keywords ?? [],
        doi,
        publicationDate: publicationDate
          ? new Date(publicationDate)
          : null,
        publisher,

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
