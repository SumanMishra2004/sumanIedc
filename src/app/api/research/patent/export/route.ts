import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { PatentStatus, TeacherStatus, UserRole } from '@prisma/client'

// GET - Export patents to CSV
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
    const patentStatus = searchParams.get('patentStatus')
    const teacherStatus = searchParams.get('teacherStatus')
    const isPublic = searchParams.get('isPublic')
    const keyword = searchParams.get('keyword')
    const search = searchParams.get('search')

    // Date range filters - we were using createdAt in main route, but here let's stick to what we used or adapt.
    // In main route it was createdFrom/To.
    const createdFrom = searchParams.get('createdFrom')
    const createdTo = searchParams.get('createdTo')

    // Also support filing date range as it is patent specific
    const filingFrom = searchParams.get('filingFrom')
    const filingTo = searchParams.get('filingTo')

    // Author filters (same logic as book chapter)
    const facultyAuthorIds = searchParams.get('facultyAuthorIds')
    const studentAuthorIds = searchParams.get('studentAuthorIds')

    // Build where clause with access control
    const where: any = {}

    // Access control based on role
    if (session.user.role === UserRole.STUDENT) {
      where.OR = [
        { isPublic: true },
        { studentAuthors: { some: { userId: session.user.id } } }
      ]
    } else if (session.user.role === UserRole.FACULTY) {
      where.OR = [
        { isPublic: true },
        { facultyAuthors: { some: { userId: session.user.id } } }
      ]
    }
    // ADMIN sees everything - no filter needed

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

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { abstract: { contains: search, mode: 'insensitive' } },
        { grantedPatentNo: { contains: search, mode: 'insensitive' } },
        { applicationNo: { contains: search, mode: 'insensitive' } },
        { patentLink: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (createdFrom || createdTo) {
      where.createdAt = {}
      if (createdFrom) where.createdAt.gte = new Date(createdFrom)
      if (createdTo) where.createdAt.lte = new Date(createdTo)
    }

    if (filingFrom || filingTo) {
      where.filingDate = {}
      if (filingFrom) where.filingDate.gte = new Date(filingFrom)
      if (filingTo) where.filingDate.lte = new Date(filingTo)
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
    const patents = await prisma.patent.findMany({
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
      'Teacher Status',
      'Granted Patent No',
      'Application No',
      'Patent Link',
      'Filing Date',
      'Submission Date',
      'Publication Date',
      'Grant Date',
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
      ...patents.map(patent => {
        const studentAuthors = patent.studentAuthors
          .map(sa => `${sa.user.name} (${sa.user.email})`)
          .join('; ')
        
        const facultyAuthors = patent.facultyAuthors
          .map(fa => `${fa.user.name} (${fa.user.email})`)
          .join('; ')

        const keywords = Array.isArray(patent.keywords) ? patent.keywords.join('; ') : ''

        return [
          patent.id,
          `"${(patent.title || '').replace(/"/g, '""')}"`,
          `"${(patent.abstract || '').replace(/"/g, '""')}"`,
          patent.patentStatus,
          patent.teacherStatus,
          `"${(patent.grantedPatentNo || '').replace(/"/g, '""')}"`,
          `"${(patent.applicationNo || '').replace(/"/g, '""')}"`,
          `"${(patent.patentLink || '').replace(/"/g, '""')}"`,
          patent.filingDate ? new Date(patent.filingDate).toISOString() : '',
          patent.submissionDate ? new Date(patent.submissionDate).toISOString() : '',
          patent.publicationDate ? new Date(patent.publicationDate).toISOString() : '',
          patent.grantDate ? new Date(patent.grantDate).toISOString() : '',
          patent.isPublic,
          `"${keywords}"`,
          `"${studentAuthors}"`,
          `"${facultyAuthors}"`,
          new Date(patent.createdAt).toISOString(),
          new Date(patent.updatedAt).toISOString(),
          patent.documentUrl || '',
          patent.imageUrl || ''
        ].join(',')
      })
    ]

    const csv = csvRows.join('\n')

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="patents-${new Date().toISOString()}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting patents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
