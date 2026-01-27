import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { auth } from '@/lib/auth'

// GET - Get statistics for book chapters
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
   
    // Get counts by book chapter status
    const bookChapterStatusCounts = await prisma.bookChapter.groupBy({
      by: ['bookChapterStatus'],
      where: roleFilter,
      _count: {
        id: true
      }
    })

    // Get counts by teacher status
    const teacherStatusCounts = await prisma.bookChapter.groupBy({
      by: ['teacherStatus'],
      where: roleFilter,
      _count: {
        id: true
      }
    })

    // Get total counts - Fix: Properly combine filters
    const [total, publicCount, privateCount] = await Promise.all([
      prisma.bookChapter.count({ where: roleFilter }),
      prisma.bookChapter.count({ 
        where: user.role === UserRole.ADMIN 
          ? { isPublic: true }
          : { 
              AND: [
                roleFilter,
                { isPublic: true }
              ]
            }
      }),
      prisma.bookChapter.count({ 
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
    const financials = await prisma.bookChapter.aggregate({
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

    // Get recent book chapters
    const recentChapters = await prisma.bookChapter.findMany({
      where: roleFilter,
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        bookChapterStatus: true,
        teacherStatus: true,
        createdAt: true
      }
    })

    // Get publication trend (by month for last 12 months)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    // Fix: Get all chapters then group by month in JS
    const chaptersForTrend = await prisma.bookChapter.findMany({
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
    const monthlyTrend = chaptersForTrend.reduce((acc: { month: string, count: number }[], chapter) => {
      const monthYear = `${chapter.createdAt.getFullYear()}-${String(chapter.createdAt.getMonth() + 1).padStart(2, '0')}`
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

    const chaptersForDailyTrend = await prisma.bookChapter.findMany({
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
    const dailyTrend = chaptersForDailyTrend.reduce((acc: { date: string, count: number }[], chapter) => {
      const dateStr = `${chapter.createdAt.getFullYear()}-${String(chapter.createdAt.getMonth() + 1).padStart(2, '0')}-${String(chapter.createdAt.getDate()).padStart(2, '0')}`
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

    const chaptersForWeeklyTrend = await prisma.bookChapter.findMany({
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
    const weeklyTrend = chaptersForWeeklyTrend.reduce((acc: { week: string, count: number }[], chapter) => {
      const date = chapter.createdAt
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
      bookChapterStatusCounts: bookChapterStatusCounts.map(s => ({
        status: s.bookChapterStatus,
        count: s._count.id
      })),
      teacherStatusCounts: teacherStatusCounts.map(s => ({
        status: s.teacherStatus,
        count: s._count.id
      })),
      financials: {
        totalRegistrationFees: financials._sum.registrationFees || 0,
        totalReimbursement: financials._sum.reimbursement || 0,
        avgRegistrationFees: financials._avg.registrationFees || 0,
        avgReimbursement: financials._avg.reimbursement || 0
      },
      recentChapters,
      monthlyTrend,
      dailyTrend,
      weeklyTrend
    })
  } catch (error) {
    console.error('Error fetching book chapter stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
