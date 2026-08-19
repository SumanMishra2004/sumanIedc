import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { GrantInStatus, UserRole } from '@prisma/client'

// GET - Export grants to CSV
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

    const grantInStatus = searchParams.get('grantInStatus')
    const isPublic = searchParams.get('isPublic')
    const projectCode = searchParams.get('projectCode')
    
    // Date range filters
    const applicationDateFrom = searchParams.get('applicationDateFrom')
    const applicationDateTo = searchParams.get('applicationDateTo')
    const grantDateFrom = searchParams.get('grantDateFrom')
    const grantDateTo = searchParams.get('grantDateTo')

    // Amount range filters
    const minAmountGranted = searchParams.get('minAmountGranted')
    const maxAmountGranted = searchParams.get('maxAmountGranted')
    const minUsedAmount = searchParams.get('minUsedAmount')
    const maxUsedAmount = searchParams.get('maxUsedAmount')

    // Author filters
    const facultyAuthorIds = searchParams.get('facultyAuthorIds')
    const studentAuthorIds = searchParams.get('studentAuthorIds')

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
    } else if (session.user.role === UserRole.ADMIN) {
      where.hideFromAdmin = false;
    }

    if (grantInStatus) {
      where.grantInStatus = grantInStatus as GrantInStatus
    }

    if (isPublic !== null && isPublic !== undefined) {
      where.isPublic = isPublic === 'true'
    }

    if (projectCode) {
      where.projectCode = {
        contains: projectCode,
        mode: 'insensitive'
      }
    }

    if (applicationDateFrom || applicationDateTo) {
      where.applicationDate = {}
      if (applicationDateFrom) where.applicationDate.gte = new Date(applicationDateFrom)
      if (applicationDateTo) where.applicationDate.lte = new Date(applicationDateTo)
    }

    if (grantDateFrom || grantDateTo) {
      where.grantDate = {}
      if (grantDateFrom) where.grantDate.gte = new Date(grantDateFrom)
      if (grantDateTo) where.grantDate.lte = new Date(grantDateTo)
    }

    if (minAmountGranted || maxAmountGranted) {
      where.amountGranted = {}
      if (minAmountGranted) where.amountGranted.gte = parseFloat(minAmountGranted)
      if (maxAmountGranted) where.amountGranted.lte = parseFloat(maxAmountGranted)
    }

    if (minUsedAmount || maxUsedAmount) {
      where.usedAmount = {}
      if (minUsedAmount) where.usedAmount.gte = parseFloat(minUsedAmount)
      if (maxUsedAmount) where.usedAmount.lte = parseFloat(maxUsedAmount)
    }

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

    const grants = await prisma.grantIn.findMany({
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

    const headers = [
      'ID',
      'Project Code',
      'Status',
      'Amount Granted',
      'Used Amount',
      'Duration',
      'Application Date',
      'Grant Date',
      'Is Public',
      'Student Authors',
      'Faculty Authors',
      'Created At',
      'Updated At'
    ]

    const csvRows = [
      headers.join(','),
      ...grants.map(grant => {
        const studentAuthors = grant.studentAuthors
          .map(sa => `${sa.user.name} (${sa.user.email})`)
          .join('; ')
        
        const facultyAuthors = grant.facultyAuthors
          .map(fa => `${fa.user?.name ?? 'Unknown'} (${fa.user?.email ?? 'N/A'})`)
          .join('; ')

        return [
          grant.id,
          `"${(grant.projectCode || '').replace(/"/g, '""')}"`,
          grant.grantInStatus,
          grant.amountGranted || '',
          grant.usedAmount || '',
          `"${(grant.durationOfProject || '').replace(/"/g, '""')}"`,
          grant.applicationDate ? new Date(grant.applicationDate).toISOString() : '',
          grant.grantDate ? new Date(grant.grantDate).toISOString() : '',
          grant.isPublic,
          `"${studentAuthors}"`,
          `"${facultyAuthors}"`,
          new Date(grant.createdAt).toISOString(),
          new Date(grant.updatedAt).toISOString()
        ].join(',')
      })
    ]

    const csv = csvRows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="grants-${new Date().toISOString()}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting grants:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
