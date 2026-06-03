import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
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
} from "@prisma/client"
import { journalSchema } from "@/lib/validations/journal"

// GET - List all journals with filtering, pagination, and search
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const searchParams = req.nextUrl.searchParams

    // Pagination (Default 10, Maximum 100)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100)
    const skip = (page - 1) * limit

    // Sorting
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Filters
    const journalStatus = searchParams.get("journalStatus")
    const teacherStatus = searchParams.get("teacherStatus")
    const isPublic = searchParams.get("isPublic")
    const scope = searchParams.get("scope")
    const reviewType = searchParams.get("reviewType")
    const accessType = searchParams.get("accessType")
    const indexing = searchParams.get("indexing")
    const quartile = searchParams.get("quartile")
    const publicationMode = searchParams.get("publicationMode")
    const keyword = searchParams.get("keyword")
    const publisher = searchParams.get("publisher")
    const search = searchParams.get("search")

    // Date range filters
    const createdFrom = searchParams.get("createdFrom")
    const createdTo = searchParams.get("createdTo")
    const publishedFrom = searchParams.get("publishedFrom")
    const publishedTo = searchParams.get("publishedTo")

    // Fee range filters
    const minRegistrationFees = searchParams.get("minRegistrationFees")
    const maxRegistrationFees = searchParams.get("maxRegistrationFees")
    const minReimbursement = searchParams.get("minReimbursement")
    const maxReimbursement = searchParams.get("maxReimbursement")

    // Impact factor range filters
    const minImpactFactor = searchParams.get("minImpactFactor")
    const maxImpactFactor = searchParams.get("maxImpactFactor")

    // Build where clause
    const where: any = {}

    // Access control based on role
    if (!session) {
      // Not logged in - only public journals
      where.isPublic = true
    } else if (session.user.role === UserRole.STUDENT) {
      // Students see: public journals OR journals where they are authors
      where.OR = [
        { isPublic: true },
        { studentAuthors: { some: { userId: session.user.id } } }
      ]
    } else if (session.user.role === UserRole.FACULTY) {
      // Faculty see: public journals OR journals where they are reviewers/authors
      where.OR = [
        { isPublic: true },
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

    if (isPublic !== null && isPublic !== undefined && isPublic !== "") {
      where.isPublic = isPublic === "true"
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
        mode: "insensitive"
      }
    }

    // Search across multiple fields
    if (search) {
      const searchConditions = [
        { title: { contains: search, mode: "insensitive" } },
        { journalName: { contains: search, mode: "insensitive" } },
        { abstract: { contains: search, mode: "insensitive" } },
        { publisher: { contains: search, mode: "insensitive" } },
        { serialNo: { contains: search, mode: "insensitive" } },
        { doi: { contains: search, mode: "insensitive" } }
      ]
      
      // If we already have filters or access rules on where, combine them
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions }
        ]
        delete where.OR
      } else {
        where.OR = searchConditions
      }
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
    console.error("Error fetching journals:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create a new journal
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
      body.journalStatus = JournalStatus.SUBMITTED
      body.isPublic = false

      // Auto-assign creating student if not present in the payload
      if (!body.studentAuthorIds || body.studentAuthorIds.length === 0) {
        body.studentAuthorIds = [session.user.id]
      } else if (!body.studentAuthorIds.includes(session.user.id)) {
        body.studentAuthorIds.push(session.user.id)
      }
    }

    // Validate request body with Zod
    const validation = journalSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message, details: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data

    // Double-check duplicate serial number
    const existingJournal = await prisma.journal.findUnique({
      where: { serialNo: data.serialNo }
    })

    if (existingJournal) {
      return NextResponse.json(
        { error: "A journal with this serial number already exists" },
        { status: 400 }
      )
    }

    // Validate faculty authors exist
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

    // Validate student authors exist
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

    // Create Journal inside database
    const journal = await prisma.journal.create({
      data: {
        serialNo: data.serialNo,
        title: data.title,
        journalName: data.journalName,
        abstract: data.abstract,
        scope: data.scope,
        reviewType: data.reviewType,
        accessType: data.accessType,
        indexing: data.indexing,
        quartile: data.quartile,
        publicationMode: data.publicationMode,
        impactFactor: data.impactFactor,
        impactFactorDate: data.impactFactorDate ? new Date(data.impactFactorDate) : null,
        publisher: data.publisher,
        publicationDate: data.publicationDate ? new Date(data.publicationDate) : null,
        doi: data.doi,
        paperLink: data.paperLink,
        keywords: data.keywords,
        registrationFees: data.registrationFees,
        reimbursement: data.reimbursement,
        journalStatus: data.journalStatus,
        teacherStatus: data.teacherStatus,
        isPublic: data.isPublic,
        imageUrl: data.imageUrl,
        documentUrl: data.documentUrl,

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
    const facultyUserIds = journal.facultyAuthors.map((fa) => fa.userId)
    for (const fId of facultyUserIds) {
      try {
        await prisma.notification.create({
          data: {
            userId: fId,
            title: "Co-authored Publication Submitted",
            message: `A new co-authored publication '${journal.title}' has been submitted for review.`,
            type: "JOURNAL_SUBMITTED",
            link: `/dashboard/journal?id=${journal.id}`,
          },
        })
      } catch (err) {
        console.error("Failed to create notification for faculty author", fId, err)
      }
    }

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

// DELETE - Bulk delete journals with permissions
export async function DELETE(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "IDs array is required" },
        { status: 400 }
      )
    }

    const userRole = session.user.role
    const userId = session.user.id

    // Student role is completely forbidden from deleting
    if (userRole === UserRole.STUDENT) {
      return NextResponse.json(
        { error: "Unauthorized - Students cannot delete journals" },
        { status: 403 }
      )
    }

    // Faculty role can only delete journals they are reviewing/assigned to
    if (userRole === UserRole.FACULTY) {
      const journals = await prisma.journal.findMany({
        where: { id: { in: ids } },
        include: { facultyAuthors: true }
      })

      const isAuthorized = journals.every((j) =>
        j.facultyAuthors.some((fa) => fa.userId === userId)
      )

      if (!isAuthorized) {
        return NextResponse.json(
          { error: "Unauthorized - You can only delete journals you are assigned to review" },
          { status: 403 }
        )
      }
    }

    // Delete journals (cascade will delete authors)
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
    console.error("Error bulk deleting journals:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
