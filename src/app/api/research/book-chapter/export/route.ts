import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { BookchapterStatus, TeacherStatus, UserRole } from '@prisma/client'

// GET - Export book chapters to CSV
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

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { abstract: { contains: search, mode: 'insensitive' } },
        { publisher: { contains: search, mode: 'insensitive' } },
        { isbnIssn: { contains: search, mode: 'insensitive' } },
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
    const bookChapters = await prisma.bookChapter.findMany({
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
      'Title',
      'Abstract',
      'Status',
      'ISBN/ISSN',
      'Publisher',
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
      ...bookChapters.map(chapter => {
        const studentAuthors = chapter.studentAuthors
          .map(sa => `${sa.user.name} (${sa.user.email})`)
          .join('; ')
        
        const facultyAuthors = chapter.facultyAuthors
          .map(fa => `${fa.user.name} (${fa.user.email})`)
          .join('; ')

        const keywords = chapter.keywords.join('; ')

        return [
          chapter.id,
          `"${(chapter.title || '').replace(/"/g, '""')}"`,
          `"${(chapter.abstract || '').replace(/"/g, '""')}"`,
          chapter.bookChapterStatus,
          chapter.teacherStatus,
          chapter.isbnIssn || '',
          `"${(chapter.publisher || '').replace(/"/g, '""')}"`,
          chapter.doi || '',
          chapter.publicationDate ? new Date(chapter.publicationDate).toISOString() : '',
          chapter.registrationFees || '',
          chapter.reimbursement || '',
          chapter.isPublic,
          `"${keywords}"`,
          `"${studentAuthors}"`,
          `"${facultyAuthors}"`,
          new Date(chapter.createdAt).toISOString(),
          new Date(chapter.updatedAt).toISOString(),
          chapter.documentUrl || '',
          chapter.imageUrl || ''
        ].join(',')
      })
    ]

    const csv = csvRows.join('\n')

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="book-chapters-${new Date().toISOString()}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting book chapters:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
