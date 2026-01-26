import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { auth } from '@/lib/auth'

// GET - Get statistics for copyrights
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
   
    // Get counts by status
    const statusCounts = await prisma.copyright.groupBy({
      by: ['status'],
      where: roleFilter,
      _count: {
        id: true
      }
    })

    // Get total counts
    const [total, publicCount, privateCount] = await Promise.all([
      prisma.copyright.count({ where: roleFilter }),
      prisma.copyright.count({ 
        where: user.role === UserRole.ADMIN 
          ? { isPublic: true }
          : { 
              AND: [
                roleFilter,
                { isPublic: true }
              ]
            }
      }),
      prisma.copyright.count({ 
        where: user.role === UserRole.ADMIN 
          ? { isPublic: false }
          : { 
              AND: [
                roleFilter,
                { isPublic: false }
              ]
            }
      })
    ])

    // Get total fees and reimbursements
    const financials = await prisma.copyright.aggregate({
      where: roleFilter,
      _sum: {
        registrationFees: true,
        reimbursement: true
      },
      _avg: {
        registrationFees: true,
        reimbursement: true
      }
    })

    // Get recent copyrights
    const recentCopyrights = await prisma.copyright.findMany({
      where: roleFilter,
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

    const copyrightsForTrend = await prisma.copyright.findMany({
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
    const monthlyTrend = copyrightsForTrend.reduce((acc: { month: string, count: number }[], copyright) => {
      const monthYear = `${copyright.createdAt.getFullYear()}-${String(copyright.createdAt.getMonth() + 1).padStart(2, '0')}`
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

    const copyrightsForDailyTrend = await prisma.copyright.findMany({
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
    const dailyTrend = copyrightsForDailyTrend.reduce((acc: { date: string, count: number }[], copyright) => {
      const dateStr = `${copyright.createdAt.getFullYear()}-${String(copyright.createdAt.getMonth() + 1).padStart(2, '0')}-${String(copyright.createdAt.getDate()).padStart(2, '0')}`
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

    const copyrightsForWeeklyTrend = await prisma.copyright.findMany({
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
    const weeklyTrend = copyrightsForWeeklyTrend.reduce((acc: { week: string, count: number }[], copyright) => {
      const date = copyright.createdAt
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

    return NextResponse.json({
      userRole: user.role,
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
      recentCopyrights,
      monthlyTrend,
      dailyTrend,
      weeklyTrend
    })
  } catch (error) {
    console.error('Error fetching copyright stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
