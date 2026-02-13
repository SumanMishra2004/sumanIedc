import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { auth } from '@/lib/auth'

// GET - Get statistics for conferences
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get user with role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Build filter based on user role
    const roleFilter = user.role === UserRole.ADMIN 
      ? {} // Admin sees all
      : user.role === UserRole.FACULTY
      ? {
          OR: [
            { isPublic: true },
            { facultyAuthors: { some: { userId: user.id } } }
          ]
        }
      : { // STUDENT
          OR: [
            { isPublic: true },
            { studentAuthors: { some: { userId: user.id } } }
          ]
        }
   
    // Get counts by conference status
    const conferenceStatusCounts = await prisma.conference.groupBy({
      by: ['conferenceStatus'],
      where: roleFilter,
      _count: {
        conferenceStatus: true
      }
    })

    // Get public vs private counts
    const publicCount = await prisma.conference.count({
      where: {
        ...roleFilter,
        isPublic: true
      }
    })

    const privateCount = await prisma.conference.count({
      where: {
        ...roleFilter,
        isPublic: false
      }
    })
    
    // Get total count
    const total = await prisma.conference.count({
      where: roleFilter
    })

    // Get publication trend (by month for last 12 months)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    // Fix: Get all chapters then group by month in JS
    const conferencesForTrend = await prisma.conference.findMany({
      where: {
        ...roleFilter,
        createdAt: {
          gte: oneYearAgo
        }
      },
      select: {
        createdAt: true
      }
    })

    // Group by month manually
    const monthlyTrend = conferencesForTrend.reduce((acc: { month: string, count: number }[], conference) => {
      const monthYear = `${conference.createdAt.getFullYear()}-${String(conference.createdAt.getMonth() + 1).padStart(2, '0')}`
      const existing = acc.find(item => item.month === monthYear)
      if (existing) {
        existing.count++
      } else {
        acc.push({ month: monthYear, count: 1 })
      }
      return acc
    }, [])

    // Sort by month
    monthlyTrend.sort((a, b) => a.month.localeCompare(b.month))
    // Get publication trend by day (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const conferencesForDailyTrend = await prisma.conference.findMany({
      where: {
      ...roleFilter,
      createdAt: {
        gte: thirtyDaysAgo
      }
      },
      select: {
      createdAt: true
      }
    })

    // Group by day manually
    const dailyTrend = conferencesForDailyTrend.reduce((acc: { date: string, count: number }[], conference) => {
      const dateStr = `${conference.createdAt.getFullYear()}-${String(conference.createdAt.getMonth() + 1).padStart(2, '0')}-${String(conference.createdAt.getDate()).padStart(2, '0')}`
      const existing = acc.find(item => item.date === dateStr)
      if (existing) {
      existing.count++
      } else {
      acc.push({ date: dateStr, count: 1 })
      }
      return acc
    }, [])

    // Sort by date
    dailyTrend.sort((a, b) => a.date.localeCompare(b.date))

    // Get publication trend by week (last 12 weeks)
    const twelveWeeksAgo = new Date()
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84) // 12 weeks = 84 days

    const conferencesForWeeklyTrend = await prisma.conference.findMany({
      where: {
      ...roleFilter,
      createdAt: {
        gte: twelveWeeksAgo
      }
      },
      select: {
      createdAt: true
      }
    })

    // Group by week manually
    const weeklyTrend = conferencesForWeeklyTrend.reduce((acc: { week: string, count: number }[], conference) => {
      const date = conference.createdAt
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
      const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
      const weekStr = `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`
      
      const existing = acc.find(item => item.week === weekStr)
      if (existing) {
      existing.count++
      } else {
      acc.push({ week: weekStr, count: 1 })
      }
      return acc
    }, [])

    // Sort by week
    weeklyTrend.sort((a, b) => a.week.localeCompare(b.week))

    // Get financial stats
    const financialStats = await prisma.conference.aggregate({
      where: roleFilter,
      _sum: {
        registrationFees: true,
        reimbursement: true,
      },
      _avg: {
        registrationFees: true,
        reimbursement: true,
      }
    })

    return NextResponse.json({
      total,
      publicCount,
      privateCount,
      conferenceStatusCounts: conferenceStatusCounts.map(item => ({
        status: item.conferenceStatus,
        count: item._count.conferenceStatus
      })),
      monthlyTrend,
      dailyTrend,
      weeklyTrend,
      financials: {
        totalRegistrationFees: financialStats._sum.registrationFees || 0,
        avgRegistrationFees: financialStats._avg.registrationFees || 0,
        totalReimbursement: financialStats._sum.reimbursement || 0,
        avgReimbursement: financialStats._avg.reimbursement || 0,
      }
    })
  } catch (error) {
    console.error('Error fetching conference stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
