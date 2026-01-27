import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { 
  TeacherStatus, 
  UserRole, 
  JournalScope,
  JournalReviewType,
  JournalAccessType,
  JournalIndexing,
  JournalQuartile,
  JournalPublicationMode
} from '@prisma/client'

// GET - Export journals to CSV
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    const searchParams = req.nextUrl.searchParams

    // Filters (same as main GET endpoint)
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

    // Author filters
    const facultyAuthorIds = searchParams.get('facultyAuthorIds')
    const studentAuthorIds = searchParams.get('studentAuthorIds')

    // Build where clause with access control
    const where: any = {}

    // Access control based on role
    if (session.user.role === UserRole.STUDENT) {
      where.OR = [
        { studentAuthors: { some: { userId: session.user.id } } }
      ]
    } else if (session.user.role === UserRole.FACULTY) {
      where.OR = [
        { facultyAuthors: { some: { userId: session.user.id } } }
      ]
    }
    // ADMIN sees everything - no filter needed

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

    if (minImpactFactor || maxImpactFactor) {
      where.impactFactor = {}
      if (minImpactFactor) where.impactFactor.gte = parseFloat(minImpactFactor)
      if (maxImpactFactor) where.impactFactor.lte = parseFloat(maxImpactFactor)
    }

    // Author filters
    if (facultyAuthorIds) {
      const ids = facultyAuthorIds.split(',').filter(Boolean)
      if (ids.length > 0) {
        where.facultyAuthors = {
          some: {
            userId: {
              in: ids
            }
          }
        }
      }
    }

    if (studentAuthorIds) {
      const ids = studentAuthorIds.split(',').filter(Boolean)
      if (ids.length > 0) {
        where.studentAuthors = {
          some: {
            userId: {
              in: ids
            }
          }
        }
      }
    }

    // Fetch all matching data
    const journals = await prisma.journal.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        studentAuthors: {
          include: {
            user: {
              select: {
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
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    // Generate CSV content
    const headers = [
      'ID',
      'Serial No',
      'Title',
      'Journal Name',
      'Abstract',
      'Scope',
      'Review Type',
      'Access Type',
      'Indexing',
      'Quartile',
      'Publication Mode',
      'Teacher Status',
      'Impact Factor',
      'Impact Factor Date',
      'Publisher',
      'Paper Link',
      'DOI',
      'Publication Date',
      'Registration Fees',
      'Reimbursement',
      'Is Public',
      'Keywords',
      'Student Authors',
      'Faculty Authors',
      'Created At',
      'Updated At',
      'Image URL',
      'Document URL'
    ]

    const csvRows = [
      headers.join(','),
      ...journals.map(journal => {
        const studentAuthors = journal.studentAuthors
          .map(sa => `${sa.user.name} (${sa.user.email})`)
          .join('; ')
        
        const facultyAuthors = journal.facultyAuthors
          .map(fa => `${fa.user.name} (${fa.user.email})`)
          .join('; ')

        const keywords = journal.keywords.join('; ')

        return [
          journal.id,
          `"${(journal.serialNo || '').replace(/"/g, '""')}"`,
          `"${(journal.title || '').replace(/"/g, '""')}"`,
          `"${(journal.journalName || '').replace(/"/g, '""')}"`,
          `"${(journal.abstract || '').replace(/"/g, '""')}"`,
          journal.scope,
          journal.reviewType,
          journal.accessType,
          journal.indexing,
          journal.quartile,
          journal.publicationMode,
          journal.teacherStatus,
          journal.impactFactor || '',
          journal.impactFactorDate ? new Date(journal.impactFactorDate).toISOString() : '',
          `"${(journal.publisher || '').replace(/"/g, '""')}"`,
          journal.paperLink || '',
          journal.doi || '',
          journal.publicationDate ? new Date(journal.publicationDate).toISOString() : '',
          journal.registrationFees || '',
          journal.reimbursement || '',
          journal.isPublic,
          `"${keywords}"`,
          `"${studentAuthors}"`,
          `"${facultyAuthors}"`,
          new Date(journal.createdAt).toISOString(),
          new Date(journal.updatedAt).toISOString(),
          journal.imageUrl || '',
          journal.documentUrl || ''
        ].join(',')
      })
    ]

    const csv = csvRows.join('\n')

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="journals-${new Date().toISOString()}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting journals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
