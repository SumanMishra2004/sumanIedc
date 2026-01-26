import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ResearchStatus, UserRole, JournalType } from '@prisma/client'

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
    const status = searchParams.get('status')
    const isPublic = searchParams.get('isPublic')
    const journalType = searchParams.get('journalType')
    const keyword = searchParams.get('keyword')
    const journalPublisher = searchParams.get('journalPublisher')
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

    if (status) {
      where.status = status as ResearchStatus
    }

    if (isPublic !== null && isPublic !== undefined) {
      where.isPublic = isPublic === 'true'
    }

    if (journalType) {
      where.journalType = journalType as JournalType
    }

    if (keyword) {
      where.keywords = {
        has: keyword
      }
    }

    if (journalPublisher) {
      where.journalPublisher = {
        contains: journalPublisher,
        mode: 'insensitive'
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { titleOfJournal: { contains: search, mode: 'insensitive' } },
        { abstract: { contains: search, mode: 'insensitive' } },
        { journalPublisher: { contains: search, mode: 'insensitive' } },
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
      'Journal Title',
      'Article Title',
      'Journal Type',
      'Abstract',
      'Status',
      'Impact Factor',
      'Date of Impact Factor',
      'Journal Publisher',
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
      'Document URL',
      'Image URL'
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
          `"${(journal.titleOfJournal || '').replace(/"/g, '""')}"`,
          `"${(journal.title || '').replace(/"/g, '""')}"`,
          journal.journalType,
          `"${(journal.abstract || '').replace(/"/g, '""')}"`,
          journal.status,
          journal.impactFactor || '',
          journal.dateOfImpactFactor ? new Date(journal.dateOfImpactFactor).toISOString() : '',
          `"${(journal.journalPublisher || '').replace(/"/g, '""')}"`,
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
          journal.documentUrl || '',
          journal.imageUrl || ''
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
