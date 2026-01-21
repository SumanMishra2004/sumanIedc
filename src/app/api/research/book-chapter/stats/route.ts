import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { UserRole } from '@prisma/client'

// GET - Get statistics for book chapters
export async function GET(req: NextRequest) {
  try {
    
   
    // Get counts by status
    const statusCounts = await prisma.bookChapter.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    // Get total counts
    const [total, publicCount, privateCount] = await Promise.all([
      prisma.bookChapter.count(),
      prisma.bookChapter.count({ where: { isPublic: true } }),
      prisma.bookChapter.count({ where: { isPublic: false } })
    ])

    // Get total fees and reimbursements
    const financials = await prisma.bookChapter.aggregate({
      _sum: {
        registrationFees: true,
        reimbursement: true
      },
      _avg: {
        registrationFees: true,
        reimbursement: true
      }
    })

    // Get recent book chapters
    const recentChapters = await prisma.bookChapter.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true
      }
    })

    // Get publication trend (by month for last 12 months)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const monthlyTrend = await prisma.bookChapter.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: oneYearAgo
        }
      },
      _count: {
        id: true
      }
    })

    return NextResponse.json({
      total,
      publicCount,
      privateCount,
      statusCounts: statusCounts.map(s => ({
        status: s.status,
        count: s._count.id
      })),
      financials: {
        totalRegistrationFees: financials._sum.registrationFees || 0,
        totalReimbursement: financials._sum.reimbursement || 0,
        avgRegistrationFees: financials._avg.registrationFees || 0,
        avgReimbursement: financials._avg.reimbursement || 0
      },
      recentChapters,
      monthlyTrend: monthlyTrend.length
    })
  } catch (error) {
    console.error('Error fetching book chapter stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
