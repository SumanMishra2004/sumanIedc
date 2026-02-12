import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { auth } from '@/lib/auth'

// GET - Get statistics for patents
export async function GET() {
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
   
    // Get counts by patent status
    const patentStatusCounts = await prisma.patent.groupBy({
      by: ['patentStatus'],
      where: roleFilter,
      _count: {
        id: true
      }
    })

    // Get counts by teacher status
    const teacherStatusCounts = await prisma.patent.groupBy({
      by: ['teacherStatus'],
      where: roleFilter,
      _count: {
        id: true
      }
    })

    // Get total count
    const total = await prisma.patent.count({ where: roleFilter })

    // Format response
    const formattedStatusCounts = patentStatusCounts.reduce((acc, curr) => {
      acc[curr.patentStatus] = curr._count.id
      return acc
    }, {} as Record<string, number>)

    // Get trend data for filing date
    // Monthly trend - get ALL patents with filing dates (no date restriction)
    const patentsForFilingTrend = await prisma.patent.findMany({
      where: {
        ...roleFilter,
        filingDate: {
          not: null
        }
      },
      select: {
        filingDate: true
      }
    })

    const filingMonthlyTrend = patentsForFilingTrend.reduce((acc: { month: string, count: number }[], patent) => {
      if (!patent.filingDate) return acc
      const date = new Date(patent.filingDate)
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const existing = acc.find(item => item.month === monthYear)
      if (existing) {
        existing.count++
      } else {
        acc.push({ month: monthYear, count: 1 })
      }
      return acc
    }, [])
    filingMonthlyTrend.sort((a, b) => a.month.localeCompare(b.month))

    // Filing date - daily trend (last 90 days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const patentsForFilingDailyTrend = await prisma.patent.findMany({
      where: {
        ...roleFilter,
        filingDate: {
          gte: ninetyDaysAgo,
          not: null
        }
      },
      select: {
        filingDate: true
      }
    })

    const filingDailyTrend = patentsForFilingDailyTrend.reduce((acc: { date: string, count: number }[], patent) => {
      if (!patent.filingDate) return acc
      const date = new Date(patent.filingDate)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      const existing = acc.find(item => item.date === dateStr)
      if (existing) {
        existing.count++
      } else {
        acc.push({ date: dateStr, count: 1 })
      }
      return acc
    }, [])
    filingDailyTrend.sort((a, b) => a.date.localeCompare(b.date))

    // Filing date - weekly trend (last 52 weeks / 1 year)
    const fiftyTwoWeeksAgo = new Date()
    fiftyTwoWeeksAgo.setDate(fiftyTwoWeeksAgo.getDate() - 364)

    const patentsForFilingWeeklyTrend = await prisma.patent.findMany({
      where: {
        ...roleFilter,
        filingDate: {
          gte: fiftyTwoWeeksAgo,
          not: null
        }
      },
      select: {
        filingDate: true
      }
    })

    const filingWeeklyTrend = patentsForFilingWeeklyTrend.reduce((acc: { week: string, count: number }[], patent) => {
      if (!patent.filingDate) return acc
      const date = new Date(patent.filingDate)
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
    filingWeeklyTrend.sort((a, b) => a.week.localeCompare(b.week))

    // Submission date trends - get ALL patents with submission dates
    const patentsForSubmissionTrend = await prisma.patent.findMany({
      where: {
        ...roleFilter,
        submissionDate: {
          not: null
        }
      },
      select: {
        submissionDate: true
      }
    })

    const submissionMonthlyTrend = patentsForSubmissionTrend.reduce((acc: { month: string, count: number }[], patent) => {
      if (!patent.submissionDate) return acc
      const date = new Date(patent.submissionDate)
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const existing = acc.find(item => item.month === monthYear)
      if (existing) {
        existing.count++
      } else {
        acc.push({ month: monthYear, count: 1 })
      }
      return acc
    }, [])
    submissionMonthlyTrend.sort((a, b) => a.month.localeCompare(b.month))

    const patentsForSubmissionDailyTrend = await prisma.patent.findMany({
      where: {
        ...roleFilter,
        submissionDate: {
          gte: ninetyDaysAgo,
          not: null
        }
      },
      select: {
        submissionDate: true
      }
    })

    const submissionDailyTrend = patentsForSubmissionDailyTrend.reduce((acc: { date: string, count: number }[], patent) => {
      if (!patent.submissionDate) return acc
      const date = new Date(patent.submissionDate)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      const existing = acc.find(item => item.date === dateStr)
      if (existing) {
        existing.count++
      } else {
        acc.push({ date: dateStr, count: 1 })
      }
      return acc
    }, [])
    submissionDailyTrend.sort((a, b) => a.date.localeCompare(b.date))

    const patentsForSubmissionWeeklyTrend = await prisma.patent.findMany({
      where: {
        ...roleFilter,
        submissionDate: {
          gte: fiftyTwoWeeksAgo,
          not: null
        }
      },
      select: {
        submissionDate: true
      }
    })

    const submissionWeeklyTrend = patentsForSubmissionWeeklyTrend.reduce((acc: { week: string, count: number }[], patent) => {
      if (!patent.submissionDate) return acc
      const date = new Date(patent.submissionDate)
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
    submissionWeeklyTrend.sort((a, b) => a.week.localeCompare(b.week))

    // Publication date trends - get ALL patents with publication dates
    const patentsForPublicationTrend = await prisma.patent.findMany({
      where: {
        ...roleFilter,
        publicationDate: {
          not: null
        }
      },
      select: {
        publicationDate: true
      }
    })

    const publicationMonthlyTrend = patentsForPublicationTrend.reduce((acc: { month: string, count: number }[], patent) => {
      if (!patent.publicationDate) return acc
      const date = new Date(patent.publicationDate)
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const existing = acc.find(item => item.month === monthYear)
      if (existing) {
        existing.count++
      } else {
        acc.push({ month: monthYear, count: 1 })
      }
      return acc
    }, [])
    publicationMonthlyTrend.sort((a, b) => a.month.localeCompare(b.month))

    const patentsForPublicationDailyTrend = await prisma.patent.findMany({
      where: {
        ...roleFilter,
        publicationDate: {
          gte: ninetyDaysAgo,
          not: null
        }
      },
      select: {
        publicationDate: true
      }
    })

    const publicationDailyTrend = patentsForPublicationDailyTrend.reduce((acc: { date: string, count: number }[], patent) => {
      if (!patent.publicationDate) return acc
      const date = new Date(patent.publicationDate)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      const existing = acc.find(item => item.date === dateStr)
      if (existing) {
        existing.count++
      } else {
        acc.push({ date: dateStr, count: 1 })
      }
      return acc
    }, [])
    publicationDailyTrend.sort((a, b) => a.date.localeCompare(b.date))

    const patentsForPublicationWeeklyTrend = await prisma.patent.findMany({
      where: {
        ...roleFilter,
        publicationDate: {
          gte: fiftyTwoWeeksAgo,
          not: null
        }
      },
      select: {
        publicationDate: true
      }
    })

    const publicationWeeklyTrend = patentsForPublicationWeeklyTrend.reduce((acc: { week: string, count: number }[], patent) => {
      if (!patent.publicationDate) return acc
      const date = new Date(patent.publicationDate)
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
    publicationWeeklyTrend.sort((a, b) => a.week.localeCompare(b.week))

    // Grant date trends - get ALL patents with grant dates
    const patentsForGrantTrend = await prisma.patent.findMany({
      where: {
        ...roleFilter,
        grantDate: {
          not: null
        }
      },
      select: {
        grantDate: true
      }
    })

    const grantMonthlyTrend = patentsForGrantTrend.reduce((acc: { month: string, count: number }[], patent) => {
      if (!patent.grantDate) return acc
      const date = new Date(patent.grantDate)
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const existing = acc.find(item => item.month === monthYear)
      if (existing) {
        existing.count++
      } else {
        acc.push({ month: monthYear, count: 1 })
      }
      return acc
    }, [])
    grantMonthlyTrend.sort((a, b) => a.month.localeCompare(b.month))

    const patentsForGrantDailyTrend = await prisma.patent.findMany({
      where: {
        ...roleFilter,
        grantDate: {
          gte: ninetyDaysAgo,
          not: null
        }
      },
      select: {
        grantDate: true
      }
    })

    const grantDailyTrend = patentsForGrantDailyTrend.reduce((acc: { date: string, count: number }[], patent) => {
      if (!patent.grantDate) return acc
      const date = new Date(patent.grantDate)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      const existing = acc.find(item => item.date === dateStr)
      if (existing) {
        existing.count++
      } else {
        acc.push({ date: dateStr, count: 1 })
      }
      return acc
    }, [])
    grantDailyTrend.sort((a, b) => a.date.localeCompare(b.date))

    const patentsForGrantWeeklyTrend = await prisma.patent.findMany({
      where: {
        ...roleFilter,
        grantDate: {
          gte: fiftyTwoWeeksAgo,
          not: null
        }
      },
      select: {
        grantDate: true
      }
    })

    const grantWeeklyTrend = patentsForGrantWeeklyTrend.reduce((acc: { week: string, count: number }[], patent) => {
      if (!patent.grantDate) return acc
      const date = new Date(patent.grantDate)
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
    grantWeeklyTrend.sort((a, b) => a.week.localeCompare(b.week))

    return NextResponse.json({
      total,
      submitted: formattedStatusCounts['SUBMITTED'] || 0,
      underReview: formattedStatusCounts['UNDER_REVIEW'] || 0,
      approved: formattedStatusCounts['APPROVED'] || 0,
      granted: formattedStatusCounts['GRANTED'] || 0,
      patentStatusCounts: patentStatusCounts.map(s => ({
        status: s.patentStatus,
        count: s._count.id
      })),
      teacherStatusCounts: teacherStatusCounts.map(s => ({
        status: s.teacherStatus,
        count: s._count.id
      })),
      filingDateTrends: {
        monthlyTrend: filingMonthlyTrend,
        dailyTrend: filingDailyTrend,
        weeklyTrend: filingWeeklyTrend
      },
      submissionDateTrends: {
        monthlyTrend: submissionMonthlyTrend,
        dailyTrend: submissionDailyTrend,
        weeklyTrend: submissionWeeklyTrend
      },
      publicationDateTrends: {
        monthlyTrend: publicationMonthlyTrend,
        dailyTrend: publicationDailyTrend,
        weeklyTrend: publicationWeeklyTrend
      },
      grantDateTrends: {
        monthlyTrend: grantMonthlyTrend,
        dailyTrend: grantDailyTrend,
        weeklyTrend: grantWeeklyTrend
      }
    })

  } catch (error) {
    console.error('Error fetching patent stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
