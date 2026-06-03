import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Helper: admin guard
async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return null
  }
  return session
}

// GET /api/admin/journals/stats — admin journal analytics
export async function GET(_req: NextRequest) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized — ADMIN access required' },
        { status: 403 }
      )
    }

    // Run all aggregation queries in parallel
    const [
      total,
      publicCount,
      privateCount,
      teacherStatusGroups,
      journalStatusGroups,
      indexingGroups,
      quartileGroups,
      studentAuthorDepartments,
      facultyAuthorDepartments,
      journalsForTrend,
    ] = await Promise.all([
      // Total journal count
      prisma.journal.count(),

      // Public/private counts
      prisma.journal.count({ where: { isPublic: true } }),
      prisma.journal.count({ where: { isPublic: false } }),

      // Group by teacherStatus
      prisma.journal.groupBy({
        by: ['teacherStatus'],
        _count: { id: true }
      }),

      // Group by journalStatus
      prisma.journal.groupBy({
        by: ['journalStatus'],
        _count: { id: true }
      }),

      // Group by indexing
      prisma.journal.groupBy({
        by: ['indexing'],
        _count: { id: true }
      }),

      // Group by quartile
      prisma.journal.groupBy({
        by: ['quartile'],
        _count: { id: true }
      }),

      // Department counts from student authors
      prisma.journalStudentAuthor.findMany({
        include: {
          user: {
            select: { department: true }
          }
        }
      }),

      // Department counts from faculty authors
      prisma.journalTeacherAuthor.findMany({
        include: {
          user: {
            select: { department: true }
          }
        }
      }),

      // Journals for monthly trend (last 12 months)
      prisma.journal.findMany({
        where: {
          createdAt: {
            gte: (() => {
              const d = new Date()
              d.setFullYear(d.getFullYear() - 1)
              return d
            })()
          }
        },
        select: { createdAt: true }
      }),
    ])

    // Format teacherStatus counts
    const teacherStatusCounts = teacherStatusGroups.map(g => ({
      status: g.teacherStatus,
      count: g._count.id
    }))

    // Format journalStatus counts
    const journalStatusCounts = journalStatusGroups.map(g => ({
      status: g.journalStatus,
      count: g._count.id
    }))

    // Format indexing counts
    const indexingCounts = indexingGroups.map(g => ({
      indexing: g.indexing,
      count: g._count.id
    }))

    // Format quartile counts
    const quartileCounts = quartileGroups.map(g => ({
      quartile: g.quartile,
      count: g._count.id
    }))

    // Aggregate department counts from both student and faculty authors
    const departmentMap = new Map<string, number>()

    for (const author of studentAuthorDepartments) {
      const dept = author.user.department || 'Unknown'
      departmentMap.set(dept, (departmentMap.get(dept) || 0) + 1)
    }

    for (const author of facultyAuthorDepartments) {
      const dept = author.user.department || 'Unknown'
      departmentMap.set(dept, (departmentMap.get(dept) || 0) + 1)
    }

    const departmentCounts = Array.from(departmentMap.entries())
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count)

    // Build monthly trend from journal data
    const monthlyTrend = journalsForTrend.reduce(
      (acc: { month: string; count: number }[], journal) => {
        const monthYear = `${journal.createdAt.getFullYear()}-${String(
          journal.createdAt.getMonth() + 1
        ).padStart(2, '0')}`
        const existing = acc.find(item => item.month === monthYear)
        if (existing) {
          existing.count++
        } else {
          acc.push({ month: monthYear, count: 1 })
        }
        return acc
      },
      []
    )

    // Sort by month
    monthlyTrend.sort((a, b) => a.month.localeCompare(b.month))

    return NextResponse.json({
      total,
      publicCount,
      privateCount,
      teacherStatusCounts,
      journalStatusCounts,
      indexingCounts,
      quartileCounts,
      departmentCounts,
      monthlyTrend,
    })
  } catch (error) {
    console.error('Error fetching admin journal stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
