import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { isEditorOrHigher } from '@/lib/auth/permissions'

// EDITOR and higher can access journal analytics (EDITOR is the primary reviewer)
async function requireEditorOrHigher() {
  const session = await auth()
  if (!session?.user?.id) return { session: null, status: 401 as const }
  if (!isEditorOrHigher(session.user.role)) return { session: null, status: 403 as const }
  return { session, status: 200 as const }
}

// GET /api/admin/journals/stats — journal analytics for editorial and admin roles
export async function GET(_req: NextRequest) {
  try {
    const { session, status } = await requireEditorOrHigher()
    if (!session) {
      return NextResponse.json(
        { error: status === 401 ? 'Unauthorized' : 'Forbidden — EDITOR access required' },
        { status }
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
      scopeGroups,
      impactFactorAggregate,
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
        _count: { id: true },
      }),

      // Group by journalStatus
      prisma.journal.groupBy({
        by: ['journalStatus'],
        _count: { id: true },
      }),

      // Group by indexing
      prisma.journal.groupBy({
        by: ['indexing'],
        _count: { id: true },
      }),

      // Group by quartile
      prisma.journal.groupBy({
        by: ['quartile'],
        _count: { id: true },
      }),

      // Group by scope
      prisma.journal.groupBy({
        by: ['scope'],
        _count: { id: true },
      }),

      // Average impact factor (only journals that have one set)
      prisma.journal.aggregate({
        _avg: { impactFactor: true },
        _max: { impactFactor: true },
        where: { impactFactor: { not: null } },
      }),

      // Department counts from student authors
      prisma.journalStudentAuthor.findMany({
        include: {
          user: {
            select: { department: true },
          },
        },
      }),

      // Department counts from faculty authors
      prisma.journalTeacherAuthor.findMany({
        include: {
          user: {
            select: { department: true },
          },
        },
      }),

      // Journals for monthly trend (last 12 months)
      prisma.journal.findMany({
        where: {
          createdAt: {
            gte: (() => {
              const d = new Date()
              d.setFullYear(d.getFullYear() - 1)
              return d
            })(),
          },
        },
        select: { createdAt: true, teacherStatus: true },
      }),
    ])

    // Format teacherStatus counts
    const teacherStatusCounts = teacherStatusGroups.map(g => ({
      status: g.teacherStatus,
      count: g._count.id,
    }))

    // Format journalStatus counts
    const journalStatusCounts = journalStatusGroups.map(g => ({
      status: g.journalStatus,
      count: g._count.id,
    }))

    // Format indexing counts
    const indexingCounts = indexingGroups.map(g => ({
      indexing: g.indexing,
      count: g._count.id,
    }))

    // Format quartile counts
    const quartileCounts = quartileGroups.map(g => ({
      quartile: g.quartile,
      count: g._count.id,
    }))

    // Format scope counts
    const scopeCounts = scopeGroups.map(g => ({
      scope: g.scope,
      count: g._count.id,
    }))

    // Impact factor stats
    const avgImpactFactor =
      impactFactorAggregate._avg.impactFactor != null
        ? Math.round(impactFactorAggregate._avg.impactFactor * 100) / 100
        : null
    const maxImpactFactor =
      impactFactorAggregate._max.impactFactor != null
        ? Math.round(impactFactorAggregate._max.impactFactor * 100) / 100
        : null

    // Aggregate department counts from both student and faculty authors
    const departmentMap = new Map<string, number>()

    for (const author of studentAuthorDepartments) {
      const dept = author.user?.department || 'Unknown'
      departmentMap.set(dept, (departmentMap.get(dept) || 0) + 1)
    }

    for (const author of facultyAuthorDepartments) {
      const dept = author.user?.department || 'Unknown'
      departmentMap.set(dept, (departmentMap.get(dept) || 0) + 1)
    }

    const departmentCounts = Array.from(departmentMap.entries())
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count)

    // Build monthly trend — bucket by YYYY-MM, split by teacherStatus=PUBLISHED vs others
    const monthlyTrendMap = new Map<string, { total: number; published: number }>()
    for (const journal of journalsForTrend) {
      const monthYear = `${journal.createdAt.getFullYear()}-${String(
        journal.createdAt.getMonth() + 1
      ).padStart(2, '0')}`
      const existing = monthlyTrendMap.get(monthYear) ?? { total: 0, published: 0 }
      existing.total++
      if (journal.teacherStatus === 'PUBLISHED') existing.published++
      monthlyTrendMap.set(monthYear, existing)
    }

    const monthlyTrend = Array.from(monthlyTrendMap.entries())
      .map(([month, data]) => ({ month, count: data.total, published: data.published }))
      .sort((a, b) => a.month.localeCompare(b.month))

    return NextResponse.json({
      total,
      publicCount,
      privateCount,
      avgImpactFactor,
      maxImpactFactor,
      teacherStatusCounts,
      journalStatusCounts,
      indexingCounts,
      quartileCounts,
      scopeCounts,
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
