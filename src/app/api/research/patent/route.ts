import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { PatentStatus, TeacherStatus, UserRole } from '@prisma/client'

// GET - List all patents with filtering, pagination, and search
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
    const patentStatus = searchParams.get('patentStatus')
    const teacherStatus = searchParams.get('teacherStatus')
    const isPublic = searchParams.get('isPublic')
    const keyword = searchParams.get('keyword')
    const search = searchParams.get('search')

    // Date range filters (using filingDate as primary date filter for now, or maybe generic search)
    // Adjusting based on common requirements. I'll include filters for submissionDate as well if needed.
    const createdFrom = searchParams.get('createdFrom')
    const createdTo = searchParams.get('createdTo')
    
    // Build where clause
    const where: any = {}

    // Access control based on role
    if (!session) {
      // Not logged in - only public patents
      where.isPublic = true
    } else if (session.user.role === UserRole.STUDENT) {
      // Students see: public patents OR patents where they are authors
      where.OR = [
        { isPublic: true },
        { studentAuthors: { some: { userId: session.user.id } } }
      ]
    } else if (session.user.role === UserRole.FACULTY) {
      // Faculty see: public patents OR patents where they are authors
      where.OR = [
        { isPublic: true },
        { facultyAuthors: { some: { userId: session.user.id } } }
      ]
    }
    // ADMIN sees everything - no filter needed

    // Apply filters
    if (patentStatus) {
      where.patentStatus = patentStatus as PatentStatus
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

    // Search across multiple fields
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { abstract: { contains: search, mode: 'insensitive' } },
        { grantedPatentNo: { contains: search, mode: 'insensitive' } },
        { applicationNo: { contains: search, mode: 'insensitive' } },
        { patentLink: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Date range filters
    if (createdFrom || createdTo) {
      where.createdAt = {}
      if (createdFrom) where.createdAt.gte = new Date(createdFrom)
      if (createdTo) where.createdAt.lte = new Date(createdTo)
    }

    // Fetch data with pagination
    const [patents, total] = await Promise.all([
      prisma.patent.findMany({
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
      prisma.patent.count({ where })
    ])

    return NextResponse.json({
      patents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching patents:', error)
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
      patentStatus,
      teacherStatus,
      grantedPatentNo,
      applicationNo,
      filingDate,
      submissionDate,
      publicationDate,
      grantDate,
      patentLink,
      isPublic,
      keywords,
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
    // Assuming student authors are not mandatory as per generic logic found in book-chapter but we handle it similarly

    if (keywords && !Array.isArray(keywords)) {
      return NextResponse.json(
        { error: "Keywords must be an array of strings" },
        { status: 400 }
      )
    }

    if (patentStatus && !Object.values(PatentStatus).includes(patentStatus)) {
      return NextResponse.json(
        { error: "Invalid patent status" },
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

    /* -------------------- Create Patent -------------------- */
    const patent = await prisma.patent.create({
      data: {
        title,
        abstract,
        imageUrl,
        documentUrl,
        patentStatus: patentStatus ?? PatentStatus.SUBMITTED,
        teacherStatus: teacherStatus ?? TeacherStatus.UPLOADED,
        grantedPatentNo,
        applicationNo,
        patentLink,
        isPublic: Boolean(isPublic),
        keywords: keywords ?? [],
        
        filingDate: filingDate ? new Date(filingDate) : null,
        submissionDate: submissionDate ? new Date(submissionDate) : null,
        publicationDate: publicationDate ? new Date(publicationDate) : null,
        grantDate: grantDate ? new Date(grantDate) : null,

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
      { patent },
      { status: 201 }
    )

  } catch (error) {
    console.error("Patent POST error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Bulk delete patents
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

    // Delete patents (cascade will handle authors)
    const result = await prisma.patent.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    return NextResponse.json({
      message: `Successfully deleted ${result.count} patent(s)`,
      count: result.count
    })
  } catch (error) {
    console.error('Error deleting patents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
