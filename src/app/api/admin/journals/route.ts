import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/guard'
import {
  TeacherStatus,
  JournalStatus,
  JournalScope,
  JournalIndexing,
  JournalQuartile,
} from '@prisma/client'
import { paginatedResponse, badRequestResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error-handler'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  try {
    const sp = req.nextUrl.searchParams

    const page  = Math.max(1, parseInt(sp.get('page')  || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') || '10')))
    const skip  = (page - 1) * limit

    const sortBy    = sp.get('sortBy')    || 'createdAt'
    const sortOrder = (sp.get('sortOrder') || 'desc') as 'asc' | 'desc'

    const teacherStatus  = sp.get('teacherStatus')
    const journalStatus  = sp.get('journalStatus')
    const indexing       = sp.get('indexing')
    const quartile       = sp.get('quartile')
    const scope          = sp.get('scope')
    const search         = sp.get('search')
    const department     = sp.get('department')

    // Validate enum filters before hitting the DB
    if (teacherStatus && !Object.values(TeacherStatus).includes(teacherStatus as TeacherStatus)) {
      return badRequestResponse('Invalid teacherStatus value')
    }
    if (journalStatus && !Object.values(JournalStatus).includes(journalStatus as JournalStatus)) {
      return badRequestResponse('Invalid journalStatus value')
    }
    if (indexing && !Object.values(JournalIndexing).includes(indexing as JournalIndexing)) {
      return badRequestResponse('Invalid indexing value')
    }
    if (quartile && !Object.values(JournalQuartile).includes(quartile as JournalQuartile)) {
      return badRequestResponse('Invalid quartile value')
    }
    if (scope && !Object.values(JournalScope).includes(scope as JournalScope)) {
      return badRequestResponse('Invalid scope value')
    }

    const where: Record<string, unknown> = {}
    if (teacherStatus) where.teacherStatus = teacherStatus as TeacherStatus
    if (journalStatus) where.journalStatus = journalStatus as JournalStatus
    if (indexing)      where.indexing      = indexing      as JournalIndexing
    if (quartile)      where.quartile      = quartile      as JournalQuartile
    if (scope)         where.scope         = scope         as JournalScope

    // Department filter via author relation
    if (department) {
      where.OR = [
        { studentAuthors: { some: { user: { department: { equals: department, mode: 'insensitive' } } } } },
        { facultyAuthors: { some: { user: { department: { equals: department, mode: 'insensitive' } } } } },
      ]
    }

    // Full-text search across key fields
    if (search) {
      const searchConditions = [
        { title:       { contains: search, mode: 'insensitive' } },
        { journalName: { contains: search, mode: 'insensitive' } },
        { abstract:    { contains: search, mode: 'insensitive' } },
        { publisher:   { contains: search, mode: 'insensitive' } },
        { doi:         { contains: search, mode: 'insensitive' } },
        { serialNo:    { contains: search, mode: 'insensitive' } },
      ]

      if (where.OR) {
        // Combine with existing department OR using AND
        where.AND = [{ OR: where.OR }, { OR: searchConditions }]
        delete where.OR
      } else {
        where.OR = searchConditions
      }
    }

    // Validate sortBy to prevent injection via orderBy key
    const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'journalName', 'publicationDate']
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt'

    const [journals, total] = await Promise.all([
      prisma.journal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [safeSortBy]: sortOrder },
        include: {
          studentAuthors: {
            include: { user: { select: { id: true, name: true, email: true, image: true, department: true } } },
          },
          facultyAuthors: {
            include: { user: { select: { id: true, name: true, email: true, image: true, department: true } } },
          },
        },
      }),
      prisma.journal.count({ where }),
    ])

    return paginatedResponse(journals, page, limit, total)
  } catch (error) {
    return handleApiError(error)
  }
}
