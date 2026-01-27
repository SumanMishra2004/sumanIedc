import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { 
  TeacherStatus, 
  UserRole, 
  JournalStatus,
  JournalScope,
  JournalReviewType,
  JournalAccessType,
  JournalIndexing,
  JournalQuartile,
  JournalPublicationMode
} from '@prisma/client'

// GET - List all journals with filtering, pagination, and search
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
    const journalStatus = searchParams.get('journalStatus')
    const teacherStatus = searchParams.get('teacherStatus')
    const isPublic = searchParams.get('isPublic')
    const scope = searchParams.get('scope')
    const reviewType = searchParams.get('reviewType')
    const accessType = searchParams.get('accessType')
    const indexing = searchParams.get('indexing')
    const quartile = searchParams.get('quartile')
    const publicationMode = searchParams.get('publicationMode')
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

    // Impact factor range filters
    const minImpactFactor = searchParams.get('minImpactFactor')
    const maxImpactFactor = searchParams.get('maxImpactFactor')

    // Build where clause
    const where: any = {}

    // Access control based on role
    if (!session) {
      // Not logged in - only public journals
      where.isPublic = true
    } else if (session.user.role === UserRole.STUDENT) {
      // Students see: public journals OR journals where they are authors
      where.OR = [
        { studentAuthors: { some: { userId: session.user.id } } }
      ]
    } else if (session.user.role === UserRole.FACULTY) {
      // Faculty see: public journals OR journals where they are authors
      where.OR = [
        { facultyAuthors: { some: { userId: session.user.id } } }
      ]
    }
    // ADMIN sees everything - no filter needed

    // Apply filters
    if (journalStatus) {
      where.journalStatus = journalStatus as JournalStatus
    }

    if (teacherStatus) {
      where.teacherStatus = teacherStatus as TeacherStatus
    }

    if (isPublic !== null && isPublic !== undefined) {
      where.isPublic = isPublic === 'true'
    }

    if (scope) {
      where.scope = scope as JournalScope
    }

    if (reviewType) {
      where.reviewType = reviewType as JournalReviewType
    }

    if (accessType) {
      where.accessType = accessType as JournalAccessType
    }

    if (indexing) {
      where.indexing = indexing as JournalIndexing
    }

    if (quartile) {
      where.quartile = quartile as JournalQuartile
    }

    if (publicationMode) {
      where.publicationMode = publicationMode as JournalPublicationMode
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
        { journalName: { contains: search, mode: 'insensitive' } },
        { abstract: { contains: search, mode: 'insensitive' } },
        { publisher: { contains: search, mode: 'insensitive' } },
        { serialNo: { contains: search, mode: 'insensitive' } },
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

    // Impact factor range filters
    if (minImpactFactor || maxImpactFactor) {
      where.impactFactor = {}
      if (minImpactFactor) where.impactFactor.gte = parseFloat(minImpactFactor)
      if (maxImpactFactor) where.impactFactor.lte = parseFloat(maxImpactFactor)
    }

    // Fetch data with pagination
    const [journals, total] = await Promise.all([
      prisma.journal.findMany({
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
      prisma.journal.count({ where })
    ])

    return NextResponse.json({
      journals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching journals:', error)
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
      serialNo,
      title,
      journalName,
      imageUrl,
      documentUrl,
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
      journalStatus,
      teacherStatus,
      isPublic,
      studentAuthorIds = [],
      facultyAuthorIds = []
    } = body

    /* -------------------- Basic validation -------------------- */

    if (!serialNo || typeof serialNo !== "string") {
      return NextResponse.json(
        { error: "Serial number is required" },
        { status: 400 }
      )
    }

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    if (!journalName || typeof journalName !== "string") {
      return NextResponse.json(
        { error: "Journal name is required" },
        { status: 400 }
      )
    }

    if (!scope || !Object.values(JournalScope).includes(scope)) {
      return NextResponse.json(
        { error: "Valid scope is required" },
        { status: 400 }
      )
    }

    if (!reviewType || !Object.values(JournalReviewType).includes(reviewType)) {
      return NextResponse.json(
        { error: "Valid review type is required" },
        { status: 400 }
      )
    }

    if (!accessType || !Object.values(JournalAccessType).includes(accessType)) {
      return NextResponse.json(
        { error: "Valid access type is required" },
        { status: 400 }
      )
    }

    if (!indexing || !Object.values(JournalIndexing).includes(indexing)) {
      return NextResponse.json(
        { error: "Valid indexing is required" },
        { status: 400 }
      )
    }

    if (!publicationMode || !Object.values(JournalPublicationMode).includes(publicationMode)) {
      return NextResponse.json(
        { error: "Valid publication mode is required" },
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

    if (journalStatus && !Object.values(JournalStatus).includes(journalStatus)) {
      return NextResponse.json(
        { error: "Invalid journal status" },
        { status: 400 }
      )
    }

    if (teacherStatus && !Object.values(TeacherStatus).includes(teacherStatus)) {
      return NextResponse.json(
        { error: "Invalid teacher status" },
        { status: 400 }
      )
    }

    if (quartile && !Object.values(JournalQuartile).includes(quartile)) {
      return NextResponse.json(
        { error: "Invalid quartile" },
        { status: 400 }
      )
    }

    // Check for duplicate serial number
    const existingJournal = await prisma.journal.findUnique({
      where: { serialNo }
    })

    if (existingJournal) {
      return NextResponse.json(
        { error: "A journal with this serial number already exists" },
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

    /* -------------------- Create Journal -------------------- */

    const journal = await prisma.journal.create({
      data: {
        serialNo,
        title,
        journalName,
        imageUrl,
        documentUrl,
        abstract,
        scope,
        reviewType,
        accessType,
        indexing,
        quartile: quartile ?? JournalQuartile.NOT_APPLICABLE,
        publicationMode,
        impactFactor: impactFactor !== undefined ? Number(impactFactor) : null,
        impactFactorDate: impactFactorDate ? new Date(impactFactorDate) : null,
        publisher,
        publicationDate: publicationDate ? new Date(publicationDate) : null,
        doi,
        paperLink,
        keywords: keywords ?? [],
        registrationFees: registrationFees !== undefined ? Number(registrationFees) : null,
        reimbursement: reimbursement !== undefined ? Number(reimbursement) : null,
        journalStatus: journalStatus ?? JournalStatus.SUBMITTED,
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
      { journal },
      { status: 201 }
    )

  } catch (error) {
    console.error("Journal POST error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Bulk delete journals
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

    // Delete journals (cascade will handle authors)
    const result = await prisma.journal.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    return NextResponse.json({
      message: `Successfully deleted ${result.count} journal(s)`,
      count: result.count
    })
  } catch (error) {
    console.error('Error deleting journals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
