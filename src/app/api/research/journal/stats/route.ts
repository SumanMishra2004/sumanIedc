import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { auth } from '@/lib/auth'

// GET - Get statistics for journals
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
   
    // Get counts by teacher status
    const statusCounts = await prisma.journal.groupBy({
      by: ['teacherStatus'],
      where: roleFilter,
      _count: {
        id: true
      }
    })

    // Get counts by journal status
    const journalStatusCounts = await prisma.journal.groupBy({
      by: ['journalStatus'],
      where: roleFilter,
      _count: {
        id: true
      }
    })

    // Get counts by scope
    const scopeCounts = await prisma.journal.groupBy({
      by: ['scope'],
      where: roleFilter,
      _count: {
        id: true
      }
    })

    // Get counts by indexing
    const indexingCounts = await prisma.journal.groupBy({
      by: ['indexing'],
      where: roleFilter,
      _count: {
        id: true
      }
    })

    // Get total counts
    const [total, publicCount, privateCount] = await Promise.all([
      prisma.journal.count({ where: roleFilter }),
      prisma.journal.count({ 
        where: user.role === UserRole.ADMIN 
          ? { isPublic: true }
          : { 
              AND: [
                roleFilter,
                { isPublic: true }
              ]
            }
      }),
      prisma.journal.count({ 
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

    // Get total fees, reimbursements, and impact factors
    const financials = await prisma.journal.aggregate({
      where: roleFilter,
      _sum: {
        registrationFees: true,
        reimbursement: true
      },
      _avg: {
        registrationFees: true,
        reimbursement: true,
        impactFactor: true
      }
    })

    // Get recent journals
    const recentJournals = await prisma.journal.findMany({
      where: roleFilter,
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        journalName: true,
        scope: true,
        indexing: true,
        teacherStatus: true,
        impactFactor: true,
        createdAt: true
      }
    })

    // Get publication trend (by month for last 12 months)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const journalsForTrend = await prisma.journal.findMany({
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
    const monthlyTrend = journalsForTrend.reduce((acc: { month: string, count: number }[], journal) => {
      const monthYear = `${journal.createdAt.getFullYear()}-${String(journal.createdAt.getMonth() + 1).padStart(2, '0')}`
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

    const journalsForDailyTrend = await prisma.journal.findMany({
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
    const dailyTrend = journalsForDailyTrend.reduce((acc: { date: string, count: number }[], journal) => {
      const dateStr = `${journal.createdAt.getFullYear()}-${String(journal.createdAt.getMonth() + 1).padStart(2, '0')}-${String(journal.createdAt.getDate()).padStart(2, '0')}`
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

    const journalsForWeeklyTrend = await prisma.journal.findMany({
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
    const weeklyTrend = journalsForWeeklyTrend.reduce((acc: { week: string, count: number }[], journal) => {
      const date = journal.createdAt
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
        status: s.teacherStatus,
        count: s._count.id
      })),
      journalStatusCounts: journalStatusCounts.map(j => ({
        status: j.journalStatus,
        count: j._count.id
      })),
      scopeCounts: scopeCounts.map(s => ({
        scope: s.scope,
        count: s._count.id
      })),
      indexingCounts: indexingCounts.map(i => ({
        indexing: i.indexing,
        count: i._count.id
      })),
      financials: {
        totalRegistrationFees: financials._sum.registrationFees || 0,
        totalReimbursement: financials._sum.reimbursement || 0,
        avgRegistrationFees: financials._avg.registrationFees || 0,
        avgReimbursement: financials._avg.reimbursement || 0,
        avgImpactFactor: financials._avg.impactFactor || 0
      },
      recentJournals,
      monthlyTrend,
      dailyTrend,
      weeklyTrend
    })
  } catch (error) {
    console.error('Error fetching journal stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
