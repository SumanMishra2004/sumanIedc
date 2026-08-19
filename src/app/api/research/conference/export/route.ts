import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ConferenceStatus, TeacherStatus, UserRole, ConferenceMode } from '@prisma/client'

// GET - Export conferences to CSV
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
    const conferenceStatus = searchParams.get('conferenceStatus')
    const teacherStatus = searchParams.get('teacherStatus')
    const isPublic = searchParams.get('isPublic')
    const keyword = searchParams.get('keyword')
    const conferenceName = searchParams.get('conferenceName')
    const mode = searchParams.get('mode')
    const search = searchParams.get('search')

    // Date range filters
    const minDate = searchParams.get('minDate') // conferenceDate
    const maxDate = searchParams.get('maxDate')

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

    if (conferenceStatus) {
      where.conferenceStatus = conferenceStatus as ConferenceStatus
    }

    if (teacherStatus) {
      where.teacherStatus = teacherStatus as TeacherStatus
    }

    if (mode) {
      where.mode = mode as ConferenceMode
    }

    if (isPublic !== null && isPublic !== undefined) {
      where.isPublic = isPublic === 'true'
    }

    if (keyword) {
      where.keywords = {
        has: keyword
      }
    }

    if (conferenceName) {
      where.conferenceName = {
        contains: conferenceName,
        mode: 'insensitive'
      }
    }

    if (search) {
      where.OR = [
        { conferenceName: { contains: search, mode: 'insensitive' } },
        { paperName: { contains: search, mode: 'insensitive' } },
        { abstract: { contains: search, mode: 'insensitive' } },
        { conferencePublisher: { contains: search, mode: 'insensitive' } },
        { paperDoi: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (minDate || maxDate) {
      where.conferenceDate = {}
      if (minDate) where.conferenceDate.gte = new Date(minDate)
      if (maxDate) where.conferenceDate.lte = new Date(maxDate)
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
    const conferences = await prisma.conference.findMany({
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
      'Conference Name',
      'Paper Name',
      'Abstract',
      'Status',
      'Teacher Status',
      'Mode',
      'Conference Publisher',
      'Paper DOI',
      'Conference Date',
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
      ...conferences.map(conf => {
        const studentAuthors = conf.studentAuthors
          .map(sa => `${sa.user.name} (${sa.user.email})`)
          .join('; ')
        
        const facultyAuthors = conf.facultyAuthors
          .map(fa => `${fa.user?.name ?? 'Unknown'} (${fa.user?.email ?? 'N/A'})`)
          .join('; ')

        const keywords = conf.keywords.join('; ')

        return [
          conf.id,
          `"${(conf.conferenceName || '').replace(/"/g, '""')}"`,
          `"${(conf.paperName || '').replace(/"/g, '""')}"`,
          `"${(conf.abstract || '').replace(/"/g, '""')}"`,
          conf.conferenceStatus,
          conf.teacherStatus,
          conf.mode,
          `"${(conf.conferencePublisher || '').replace(/"/g, '""')}"`,
          conf.paperDoi || '',
          conf.conferenceDate ? new Date(conf.conferenceDate).toISOString() : '',
          conf.registrationFees || '',
          conf.reimbursement || '',
          conf.isPublic,
          `"${keywords}"`,
          `"${studentAuthors}"`,
          `"${facultyAuthors}"`,
          new Date(conf.createdAt).toISOString(),
          conf.updatedAt ? new Date(conf.updatedAt).toISOString() : '',
          conf.documentUrl || '',
          conf.imageUrl || ''
        ].join(',')
      })
    ]

    const csv = csvRows.join('\n')

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="conferences-${new Date().toISOString()}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting conferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
