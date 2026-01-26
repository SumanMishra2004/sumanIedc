import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ResearchStatus, UserRole } from '@prisma/client'

// GET - Export copyrights to CSV
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
    const serialNo = searchParams.get('serialNo')
    const search = searchParams.get('search')

    // Date range filters
    const createdFrom = searchParams.get('createdFrom')
    const createdTo = searchParams.get('createdTo')
    const filingFrom = searchParams.get('filingFrom')
    const filingTo = searchParams.get('filingTo')
    const submissionFrom = searchParams.get('submissionFrom')
    const submissionTo = searchParams.get('submissionTo')
    const publishedFrom = searchParams.get('publishedFrom')
    const publishedTo = searchParams.get('publishedTo')
    const grantFrom = searchParams.get('grantFrom')
    const grantTo = searchParams.get('grantTo')

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

    if (status) {
      where.status = status as ResearchStatus
    }

    if (isPublic !== null && isPublic !== undefined) {
      where.isPublic = isPublic === 'true'
    }

    if (serialNo) {
      where.serialNo = {
        contains: serialNo,
        mode: 'insensitive'
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { abstract: { contains: search, mode: 'insensitive' } },
        { serialNo: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (createdFrom || createdTo) {
      where.createdAt = {}
      if (createdFrom) where.createdAt.gte = new Date(createdFrom)
      if (createdTo) where.createdAt.lte = new Date(createdTo)
    }

    if (filingFrom || filingTo) {
      where.dateOfFiling = {}
      if (filingFrom) where.dateOfFiling.gte = new Date(filingFrom)
      if (filingTo) where.dateOfFiling.lte = new Date(filingTo)
    }

    if (submissionFrom || submissionTo) {
      where.dateOfSubmission = {}
      if (submissionFrom) where.dateOfSubmission.gte = new Date(submissionFrom)
      if (submissionTo) where.dateOfSubmission.lte = new Date(submissionTo)
    }

    if (publishedFrom || publishedTo) {
      where.dateOfPublished = {}
      if (publishedFrom) where.dateOfPublished.gte = new Date(publishedFrom)
      if (publishedTo) where.dateOfPublished.lte = new Date(publishedTo)
    }

    if (grantFrom || grantTo) {
      where.dateOfGrant = {}
      if (grantFrom) where.dateOfGrant.gte = new Date(grantFrom)
      if (grantTo) where.dateOfGrant.lte = new Date(grantTo)
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
    const copyrights = await prisma.copyright.findMany({
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
      'Abstract',
      'Status',
      'Date of Filing',
      'Date of Submission',
      'Date of Published',
      'Date of Grant',
      'Registration Fees',
      'Reimbursement',
      'Is Public',
      'Student Authors',
      'Faculty Authors',
      'Created At',
      'Updated At',
      'Document URL',
      'Image URL'
    ]

    const csvRows = [
      headers.join(','),
      ...copyrights.map(copyright => {
        const studentAuthors = copyright.studentAuthors
          .map(sa => `${sa.user.name} (${sa.user.email})`)
          .join('; ')
        
        const facultyAuthors = copyright.facultyAuthors
          .map(fa => `${fa.user.name} (${fa.user.email})`)
          .join('; ')

        return [
          copyright.id,
          `"${(copyright.serialNo || '').replace(/"/g, '""')}"`,
          `"${(copyright.title || '').replace(/"/g, '""')}"`,
          `"${(copyright.abstract || '').replace(/"/g, '""')}"`,
          copyright.status,
          copyright.dateOfFiling ? new Date(copyright.dateOfFiling).toISOString() : '',
          copyright.dateOfSubmission ? new Date(copyright.dateOfSubmission).toISOString() : '',
          copyright.dateOfPublished ? new Date(copyright.dateOfPublished).toISOString() : '',
          copyright.dateOfGrant ? new Date(copyright.dateOfGrant).toISOString() : '',
          copyright.registrationFees || '',
          copyright.reimbursement || '',
          copyright.isPublic,
          `"${studentAuthors}"`,
          `"${facultyAuthors}"`,
          new Date(copyright.createdAt).toISOString(),
          new Date(copyright.updatedAt).toISOString(),
          copyright.documentUrl || '',
          copyright.imageUrl || ''
        ].join(',')
      })
    ]

    const csv = csvRows.join('\n')

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="copyrights-${new Date().toISOString()}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting copyrights:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
