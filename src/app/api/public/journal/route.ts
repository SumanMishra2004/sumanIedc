import prisma from "@/lib/prisma"
import { JournalAccessType, JournalIndexing, JournalPublicationMode, JournalQuartile, JournalReviewType, JournalScope, JournalStatus, TeacherStatus } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

// GET - List all journals with filtering, pagination, and search
export async function GET(req: NextRequest) {
  try {
 
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

    // HARD LOCK: public API ALWAYS filters to isPublic=true and PUBLISHED status.
    // Client cannot override these via query params — doing so would leak private records.
    where.isPublic      = true
    where.journalStatus = 'PUBLISHED'

    // Apply safe filters (client cannot override isPublic or journalStatus)

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