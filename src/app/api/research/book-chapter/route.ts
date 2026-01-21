import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ResearchStatus, UserRole } from '@prisma/client'

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
    const status = searchParams.get('status')
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

    // Access control - students and non-logged users see only public
    if (!session || session.user.role === UserRole.STUDENT) {
      where.isPublic = true
    }

    // Apply filters
    if (status) {
      where.status = status as ResearchStatus
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
                  email: true
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
                  email: true
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

// POST - Create new book chapter
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      title,
      abstract,
      imageUrl,
      documentUrl,
      status,
      isbnIssn,
      registrationFees,
      reimbursement,
      isPublic,
      keywords,
      doi,
      publicationDate,
      publisher,
      studentAuthorIds,
      facultyAuthorIds
    } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Create book chapter with authors
    const bookChapter = await prisma.bookChapter.create({
      data: {
        title,
        abstract,
        imageUrl,
        documentUrl,
        status: status || ResearchStatus.DRAFT,
        isbnIssn,
        registrationFees: registrationFees ? parseFloat(registrationFees) : null,
        reimbursement: reimbursement ? parseFloat(reimbursement) : null,
        isPublic: isPublic || false,
        keywords: keywords || [],
        doi,
        publicationDate: publicationDate ? new Date(publicationDate) : null,
        publisher,
        studentAuthors: {
          create: (studentAuthorIds || []).map((userId: string) => ({
            userId
          }))
        },
        facultyAuthors: {
          create: (facultyAuthorIds || []).map((userId: string) => ({
            userId
          }))
        }
      },
      include: {
        studentAuthors: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
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
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ bookChapter }, { status: 201 })
  } catch (error) {
    console.error('Error creating book chapter:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
