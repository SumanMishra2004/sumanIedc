import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getJournalQueryFilter } from '@/lib/research/journalHelpers'
import { TeacherStatus, JournalStatus, JournalScope, JournalIndexing } from '@prisma/client'

/**
 * GET /api/research/journal/stats
 * Get journal statistics based on user role
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user } = session
    const searchParams = req.nextUrl.searchParams
    const userId = searchParams.get('userId') // Optional: get stats for specific user

    // Build where clause based on user role
    let baseFilter = getJournalQueryFilter(user.id, user.role)

    // If requesting stats for specific user (and have permission)
    if (userId) {
      // ADMIN/SUPERADMIN can view anyone's stats
      // EDITOR can view anyone's stats
      // FACULTY can view their own and their students' stats
      // STUDENT can only view their own stats
      const canViewUserStats =
        ['ADMIN', 'SUPERADMIN', 'EDITOR'].includes(user.role) ||
        userId === user.id

      if (!canViewUserStats) {
        return NextResponse.json(
          { error: 'You do not have permission to view these statistics' },
          { status: 403 }
        )
      }

      // Filter journals for specific user
      baseFilter = {
        OR: [
          { studentAuthors: { some: { userId } } },
          { facultyAuthors: { some: { userId } } },
        ],
      }
    }

    // Get total counts
    const [
      total,
      publicCount,
      privateCount,
      statusCounts,
      journalStatusCounts,
      scopeCounts,
      indexingCounts,
    ] = await Promise.all([
      prisma.journal.count({ where: baseFilter }),
      prisma.journal.count({ where: { ...baseFilter, isPublic: true } }),
      prisma.journal.count({ where: { ...baseFilter, isPublic: false } }),
      // Teacher status counts
      Promise.all(
        Object.values(TeacherStatus).map(async (status) => ({
          status,
          count: await prisma.journal.count({
            where: { ...baseFilter, teacherStatus: status },
          }),
        }))
      ),
      // Journal status counts
      Promise.all(
        Object.values(JournalStatus).map(async (status) => ({
          status,
          count: await prisma.journal.count({
            where: { ...baseFilter, journalStatus: status },
          }),
        }))
      ),
      // Scope counts
      Promise.all(
        Object.values(JournalScope).map(async (scope) => ({
          scope,
          count: await prisma.journal.count({
            where: { ...baseFilter, scope },
          }),
        }))
      ),
      // Indexing counts
      Promise.all(
        Object.values(JournalIndexing).map(async (indexing) => ({
          indexing,
          count: await prisma.journal.count({
            where: { ...baseFilter, indexing },
          }),
        }))
      ),
    ])

    // Get financial aggregates
    const financialAggregates = await prisma.journal.aggregate({
      where: baseFilter,
      _sum: {
        registrationFees: true,
        reimbursement: true,
        impactFactor: true,
      },
      _avg: {
        registrationFees: true,
        reimbursement: true,
        impactFactor: true,
      },
    })

    // Get recent journals
    const recentJournals = await prisma.journal.findMany({
      where: baseFilter,
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        journalName: true,
        scope: true,
        indexing: true,
        teacherStatus: true,
        impactFactor: true,
        createdAt: true,
      },
    })

    // Get monthly trend (last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const monthlyJournals = await prisma.journal.findMany({
      where: {
        ...baseFilter,
        createdAt: {
          gte: twelveMonthsAgo,
        },
      },
      select: {
        createdAt: true,
      },
    })

    // Group by month
    const monthlyTrend: { [key: string]: number } = {}
    monthlyJournals.forEach((journal) => {
      const month = journal.createdAt.toISOString().slice(0, 7) // YYYY-MM
      monthlyTrend[month] = (monthlyTrend[month] || 0) + 1
    })

    const monthlyTrendArray = Object.entries(monthlyTrend)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // Get daily trend (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailyJournals = await prisma.journal.findMany({
      where: {
        ...baseFilter,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        createdAt: true,
      },
    })

    // Group by day
    const dailyTrend: { [key: string]: number } = {}
    dailyJournals.forEach((journal) => {
      const date = journal.createdAt.toISOString().slice(0, 10) // YYYY-MM-DD
      dailyTrend[date] = (dailyTrend[date] || 0) + 1
    })

    const dailyTrendArray = Object.entries(dailyTrend)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Get weekly trend (last 12 weeks)
    const twelveWeeksAgo = new Date()
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)

    const weeklyJournals = await prisma.journal.findMany({
      where: {
        ...baseFilter,
        createdAt: {
          gte: twelveWeeksAgo,
        },
      },
      select: {
        createdAt: true,
      },
    })

    // Group by week
    const weeklyTrend: { [key: string]: number } = {}
    weeklyJournals.forEach((journal) => {
      const week = getWeekKey(journal.createdAt)
      weeklyTrend[week] = (weeklyTrend[week] || 0) + 1
    })

    const weeklyTrendArray = Object.entries(weeklyTrend)
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week))

    return NextResponse.json({
      userRole: user.role,
      userId: userId || user.id,
      total,
      publicCount,
      privateCount,
      statusCounts: statusCounts.filter((s) => s.count > 0),
      journalStatusCounts: journalStatusCounts.filter((s) => s.count > 0),
      scopeCounts: scopeCounts.filter((s) => s.count > 0),
      indexingCounts: indexingCounts.filter((s) => s.count > 0),
      financials: {
        totalRegistrationFees: financialAggregates._sum.registrationFees || 0,
        totalReimbursement: financialAggregates._sum.reimbursement || 0,
        avgRegistrationFees: financialAggregates._avg.registrationFees || 0,
        avgReimbursement: financialAggregates._avg.reimbursement || 0,
        avgImpactFactor: financialAggregates._avg.impactFactor || 0,
      },
      recentJournals,
      monthlyTrend: monthlyTrendArray,
      dailyTrend: dailyTrendArray,
      weeklyTrend: weeklyTrendArray,
    })
  } catch (error) {
    console.error('Error fetching journal statistics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to get week key (YYYY-WW)
function getWeekKey(date: Date): string {
  const year = date.getFullYear()
  const firstDayOfYear = new Date(year, 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  const week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  return `${year}-W${week.toString().padStart(2, '0')}`
}
