import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import {
  TeacherStatus,
  JournalStatus,
  JournalScope,
  JournalIndexing,
  JournalQuartile,
} from '@prisma/client'

// Helper: admin guard
async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return null
  }
  return session
}

// GET - List all journals (admin - no role-based filtering)
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized — ADMIN access required' },
        { status: 403 }
      )
    }

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
    const department = searchParams.get('department')

    // Build where clause — admin sees everything, no role filter
    const where: any = {}

    // Apply enum filters
    if (teacherStatus) {
      if (!Object.values(TeacherStatus).includes(teacherStatus as TeacherStatus)) {
        return NextResponse.json(
          { error: 'Invalid teacherStatus value' },
          { status: 400 }
        )
      }
      where.teacherStatus = teacherStatus as TeacherStatus
    }

    if (journalStatus) {
      if (!Object.values(JournalStatus).includes(journalStatus as JournalStatus)) {
        return NextResponse.json(
          { error: 'Invalid journalStatus value' },
          { status: 400 }
        )
      }
      where.journalStatus = journalStatus as JournalStatus
    }

    if (indexing) {
      if (!Object.values(JournalIndexing).includes(indexing as JournalIndexing)) {
        return NextResponse.json(
          { error: 'Invalid indexing value' },
          { status: 400 }
        )
      }
      where.indexing = indexing as JournalIndexing
    }

    if (quartile) {
      if (!Object.values(JournalQuartile).includes(quartile as JournalQuartile)) {
        return NextResponse.json(
          { error: 'Invalid quartile value' },
          { status: 400 }
        )
      }
      where.quartile = quartile as JournalQuartile
    }

    if (scope) {
      if (!Object.values(JournalScope).includes(scope as JournalScope)) {
        return NextResponse.json(
          { error: 'Invalid scope value' },
          { status: 400 }
        )
      }
      where.scope = scope as JournalScope
    }

    // Department filter — filter journals by author department
    if (department) {
      where.OR = [
        {
          studentAuthors: {
            some: {
              user: { department: { equals: department, mode: 'insensitive' } }
            }
          }
        },
        {
          facultyAuthors: {
            some: {
              user: { department: { equals: department, mode: 'insensitive' } }
            }
          }
        }
      ]
    }

    // Search across multiple fields
    if (search) {
      const searchConditions = [
        { title: { contains: search, mode: 'insensitive' } },
        { journalName: { contains: search, mode: 'insensitive' } },
        { abstract: { contains: search, mode: 'insensitive' } },
        { publisher: { contains: search, mode: 'insensitive' } },
        { doi: { contains: search, mode: 'insensitive' } },
        { serialNo: { contains: search, mode: 'insensitive' } }
      ]

      if (where.OR) {
        // If department filter already set OR, use AND to combine
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions }
        ]
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
                  image: true,
                  department: true
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
                  image: true,
                  department: true
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
    console.error('Error fetching admin journals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
