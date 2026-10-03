"use client"

import { useEffect, useState, useCallback } from "react"
import {
  BookOpen,
  FileCheck,
  Clock,
  XCircle,
  AlertCircle,
  TrendingUp,
  Globe,
  BarChart3,
} from "lucide-react"
import {
  Pie,
  PieChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  getAdminJournalStats,
  type AdminJournalStatsResponse,
} from "@/lib/admin/adminJournalApi"

// ─── Chart palette ────────────────────────────────────────────────────────────
const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "oklch(0.70 0.15 200)",
  "oklch(0.65 0.18 320)",
  "oklch(0.75 0.12 60)",
  "oklch(0.60 0.20 150)",
  "oklch(0.72 0.16 30)",
]

// ─── Teacher-status colours ───────────────────────────────────────────────────
const TEACHER_STATUS_META: Record<string, { label: string; color: string }> = {
  UPLOADED:  { label: "Uploaded",  color: "var(--chart-5)" },
  ACCEPTED:  { label: "Accepted",  color: "var(--chart-2)" },
  UPDATE:    { label: "Update",    color: "var(--chart-3)" },
  REJECTED:  { label: "Rejected",  color: "var(--chart-1)" },
  PUBLISHED: { label: "Published", color: "var(--chart-4)" },
}

// ─── Journal-status colours ───────────────────────────────────────────────────
const JOURNAL_STATUS_META: Record<string, { label: string; color: string }> = {
  SUBMITTED:    { label: "Submitted",    color: "var(--chart-5)" },
  UNDER_REVIEW: { label: "Under Review", color: "var(--chart-3)" },
  APPROVED:     { label: "Approved",     color: "var(--chart-2)" },
  PUBLISHED:    { label: "Published",    color: "var(--chart-4)" },
}

// ─── ChartConfigs ─────────────────────────────────────────────────────────────
const indexingChartConfig: ChartConfig = {
  SCOPUS:         { label: "Scopus",          color: CHART_COLORS[0] },
  SCI:            { label: "SCI",             color: CHART_COLORS[1] },
  SCIE:           { label: "SCIE",            color: CHART_COLORS[2] },
  SSCI:           { label: "SSCI",            color: CHART_COLORS[3] },
  AHCI:           { label: "AHCI",            color: CHART_COLORS[4] },
  UGC_CARE:       { label: "UGC Care",        color: CHART_COLORS[5] },
  WEB_OF_SCIENCE: { label: "Web of Science",  color: CHART_COLORS[6] },
  PUBMED:         { label: "PubMed",          color: CHART_COLORS[7] },
  IEEE_XPLORE:    { label: "IEEE Xplore",     color: CHART_COLORS[8] },
  DOAJ:           { label: "DOAJ",            color: CHART_COLORS[9] },
  NONE:           { label: "None",            color: "oklch(0.75 0.04 0)" },
}

const quartileChartConfig: ChartConfig = {
  Q1:             { label: "Q1",  color: CHART_COLORS[0] },
  Q2:             { label: "Q2",  color: CHART_COLORS[1] },
  Q3:             { label: "Q3",  color: CHART_COLORS[2] },
  Q4:             { label: "Q4",  color: CHART_COLORS[3] },
  NOT_APPLICABLE: { label: "N/A", color: CHART_COLORS[4] },
}

const scopeChartConfig: ChartConfig = {
  INTERNATIONAL: { label: "International", color: CHART_COLORS[0] },
  NATIONAL:      { label: "National",      color: CHART_COLORS[1] },
  REGIONAL:      { label: "Regional",      color: CHART_COLORS[2] },
  LOCAL:         { label: "Local",         color: CHART_COLORS[3] },
}

const departmentChartConfig: ChartConfig = {
  count: { label: "Journals", color: "var(--chart-2)" },
}

const trendChartConfig: ChartConfig = {
  count:     { label: "Submissions", color: "var(--chart-1)" },
  published: { label: "Published",   color: "var(--chart-2)" },
}

const teacherStatusChartConfig: ChartConfig = Object.fromEntries(
  Object.entries(TEACHER_STATUS_META).map(([k, v]) => [k, { label: v.label, color: v.color }])
)

const journalStatusChartConfig: ChartConfig = Object.fromEntries(
  Object.entries(JOURNAL_STATUS_META).map(([k, v]) => [k, { label: v.label, color: v.color }])
)

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function fmtMonth(yyyyMM: string): string {
  const [year, month] = yyyyMM.split("-")
  return new Date(Number(year), Number(month) - 1).toLocaleString("en-IN", {
    month: "short",
    year: "2-digit",
  })
}

// ─── Empty-state placeholder ─────────────────────────────────────────────────
function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center h-[220px] gap-2 text-muted-foreground">
      <BarChart3 className="h-8 w-8 opacity-30" />
      <p className="text-sm">No data available</p>
    </div>
  )
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function StatsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[280px] rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-[260px] rounded-xl" />
        <Skeleton className="h-[260px] rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-[260px] rounded-xl" />
        <Skeleton className="h-[260px] rounded-xl" />
        <Skeleton className="h-[260px] rounded-xl" />
      </div>
      <Skeleton className="h-[260px] rounded-xl" />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminJournalStats() {
  const [stats, setStats] = useState<AdminJournalStatsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    const response = await getAdminJournalStats()
    if (response.data) {
      setStats(response.data)
    } else if (response.error) {
      toast.error("Failed to load journal statistics", { description: response.error })
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void fetchStats()
  }, [fetchStats])

  if (isLoading) return <StatsSkeleton />
  if (!stats) return null

  // ── Derived values ──────────────────────────────────────────────────────────
  const publishedCount   = stats.journalStatusCounts.find(s => s.status === "PUBLISHED")?.count   ?? 0
  const underReviewCount = stats.journalStatusCounts.find(s => s.status === "UNDER_REVIEW")?.count ?? 0
  const approvedCount    = stats.journalStatusCounts.find(s => s.status === "APPROVED")?.count     ?? 0
  const rejectedCount    = stats.teacherStatusCounts.find(s => s.status === "REJECTED")?.count     ?? 0
  const pendingCount     = stats.teacherStatusCounts.find(s => s.status === "UPLOADED")?.count     ?? 0

  const statCards = [
    {
      title:    "Total Journals",
      value:    stats.total,
      subtitle: `${stats.publicCount} public · ${stats.privateCount} private`,
      icon:     BookOpen,
      color:    "from-blue-500/15 to-blue-600/5 border-blue-500/20",
      badge:    null,
    },
    {
      title:    "Published",
      value:    publishedCount,
      subtitle: "Fully published & public",
      icon:     FileCheck,
      color:    "from-emerald-500/15 to-emerald-600/5 border-emerald-500/20",
      badge:    null,
    },
    {
      title:    "Approved",
      value:    approvedCount,
      subtitle: "Editorially approved",
      icon:     TrendingUp,
      color:    "from-sky-500/15 to-sky-600/5 border-sky-500/20",
      badge:    null,
    },
    {
      title:    "Under Review",
      value:    underReviewCount,
      subtitle: "Awaiting review",
      icon:     Clock,
      color:    "from-amber-500/15 to-amber-600/5 border-amber-500/20",
      badge:    underReviewCount > 0 ? "needs-action" : null,
    },
    {
      title:    "Pending Verification",
      value:    pendingCount,
      subtitle: "Uploaded, awaiting PI action",
      icon:     AlertCircle,
      color:    "from-violet-500/15 to-violet-600/5 border-violet-500/20",
      badge:    pendingCount > 0 ? "needs-action" : null,
    },
    {
      title:    "Rejected",
      value:    rejectedCount,
      subtitle: "Rejected by PI / admin",
      icon:     XCircle,
      color:    "from-red-500/15 to-red-600/5 border-red-500/20",
      badge:    null,
    },
  ]

  // ── Chart data ──────────────────────────────────────────────────────────────
  const indexingData = stats.indexingCounts.map((item, idx) => ({
    ...item,
    fill: CHART_COLORS[idx % CHART_COLORS.length],
  }))

  const quartileData = stats.quartileCounts.map((item, idx) => ({
    ...item,
    fill: CHART_COLORS[idx % CHART_COLORS.length],
  }))

  const scopeData = stats.scopeCounts.map((item, idx) => ({
    ...item,
    fill: CHART_COLORS[idx % CHART_COLORS.length],
  }))

  const departmentData = [...stats.departmentCounts]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const trendData = stats.monthlyTrend.map(item => ({
    ...item,
    month: fmtMonth(item.month),
  }))

  const teacherBarData = stats.teacherStatusCounts.map(item => ({
    status: fmtLabel(item.status),
    count:  item.count,
    fill:   TEACHER_STATUS_META[item.status]?.color ?? CHART_COLORS[0],
  }))

  const journalBarData = stats.journalStatusCounts.map(item => ({
    status: fmtLabel(item.status),
    count:  item.count,
    fill:   JOURNAL_STATUS_META[item.status]?.color ?? CHART_COLORS[0],
  }))

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Row 1: Summary stat cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card) => (
          <Card
            key={card.title}
            className={`relative border bg-gradient-to-br ${card.color} transition-shadow hover:shadow-md`}
          >
            {card.badge === "needs-action" && (
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            )}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">
                {card.title}
              </CardTitle>
              <card.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold tabular-nums">{card.value}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                {card.subtitle}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Impact factor summary strip ─────────────────────────────────────── */}
      {(stats.avgImpactFactor !== null || stats.maxImpactFactor !== null) && (
        <div className="flex flex-wrap gap-3">
          {stats.avgImpactFactor !== null && (
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-2.5 shadow-sm">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <div>
                <p className="text-[11px] text-muted-foreground">Avg Impact Factor</p>
                <p className="text-lg font-bold tabular-nums">{stats.avgImpactFactor.toFixed(2)}</p>
              </div>
            </div>
          )}
          {stats.maxImpactFactor !== null && (
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-2.5 shadow-sm">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-[11px] text-muted-foreground">Highest Impact Factor</p>
                <p className="text-lg font-bold tabular-nums">{stats.maxImpactFactor.toFixed(2)}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-2.5 shadow-sm">
            <Globe className="h-4 w-4 text-violet-500" />
            <div>
              <p className="text-[11px] text-muted-foreground">Visibility Rate</p>
              <p className="text-lg font-bold tabular-nums">
                {stats.total > 0
                  ? `${Math.round((stats.publicCount / stats.total) * 100)}%`
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Row 2: Monthly trend (full width) ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Monthly Submission Trend</CardTitle>
          <CardDescription>Submissions vs published in the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          {trendData.length > 0 ? (
            <ChartContainer config={trendChartConfig} className="h-[220px] w-full">
              <LineChart data={trendData} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  width={28}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Submissions"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--chart-1)" }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="published"
                  name="Published"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={{ r: 3, fill: "var(--chart-2)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ChartContainer>
          ) : (
            <EmptyChart />
          )}
        </CardContent>
      </Card>

      {/* ── Row 3: Teacher status + Journal status bar charts ───────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Teacher / PI Verification Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">PI Verification Status</CardTitle>
            <CardDescription>Teacher workflow breakdown across all journals</CardDescription>
          </CardHeader>
          <CardContent>
            {teacherBarData.length > 0 ? (
              <ChartContainer config={teacherStatusChartConfig} className="h-[210px] w-full">
                <BarChart
                  data={teacherBarData}
                  margin={{ left: 0, right: 8, top: 4, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis
                    dataKey="status"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    width={28}
                  />
                  <ChartTooltip
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="count" name="Journals" radius={[4, 4, 0, 0]} maxBarSize={52}>
                    {teacherBarData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>

        {/* Editorial / Journal Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Editorial Pipeline Status</CardTitle>
            <CardDescription>Journal editorial lifecycle breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {journalBarData.length > 0 ? (
              <ChartContainer config={journalStatusChartConfig} className="h-[210px] w-full">
                <BarChart
                  data={journalBarData}
                  margin={{ left: 0, right: 8, top: 4, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis
                    dataKey="status"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    width={28}
                  />
                  <ChartTooltip
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="count" name="Journals" radius={[4, 4, 0, 0]} maxBarSize={52}>
                    {journalBarData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Indexing + Quartile + Scope pie charts ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Indexing Distribution */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-semibold">Indexing Distribution</CardTitle>
            <CardDescription>Journals by indexing database</CardDescription>
          </CardHeader>
          <CardContent>
            {indexingData.length > 0 ? (
              <ChartContainer config={indexingChartConfig} className="mx-auto aspect-square max-h-[230px]">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => [`${value}`, fmtLabel(String(name))]}
                        hideLabel
                      />
                    }
                  />
                  <Pie
                    data={indexingData}
                    dataKey="count"
                    nameKey="indexing"
                    innerRadius={38}
                    outerRadius={80}
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                  >
                    {indexingData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <EmptyChart />
            )}
            {/* Legend */}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 justify-center">
              {indexingData.map((entry, idx) => (
                <span key={idx} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: entry.fill }} />
                  {fmtLabel(entry.indexing)} ({entry.count})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quartile Distribution */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-semibold">Quartile Distribution</CardTitle>
            <CardDescription>Q1 through Q4 breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {quartileData.length > 0 ? (
              <ChartContainer config={quartileChartConfig} className="mx-auto aspect-square max-h-[230px]">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => [`${value}`, fmtLabel(String(name))]}
                        hideLabel
                      />
                    }
                  />
                  <Pie
                    data={quartileData}
                    dataKey="count"
                    nameKey="quartile"
                    innerRadius={38}
                    outerRadius={80}
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                  >
                    {quartileData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <EmptyChart />
            )}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 justify-center">
              {quartileData.map((entry, idx) => (
                <span key={idx} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: entry.fill }} />
                  {fmtLabel(entry.quartile)} ({entry.count})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Scope Distribution */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-semibold">Scope Distribution</CardTitle>
            <CardDescription>International / National / Regional / Local</CardDescription>
          </CardHeader>
          <CardContent>
            {scopeData.length > 0 ? (
              <ChartContainer config={scopeChartConfig} className="mx-auto aspect-square max-h-[230px]">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => [`${value}`, fmtLabel(String(name))]}
                        hideLabel
                      />
                    }
                  />
                  <Pie
                    data={scopeData}
                    dataKey="count"
                    nameKey="scope"
                    innerRadius={38}
                    outerRadius={80}
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                  >
                    {scopeData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <EmptyChart />
            )}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 justify-center">
              {scopeData.map((entry, idx) => (
                <span key={idx} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: entry.fill }} />
                  {fmtLabel(entry.scope)} ({entry.count})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 5: Department horizontal bar (full width) ───────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Department Contribution</CardTitle>
          <CardDescription>Top 8 departments by total journal authorship</CardDescription>
        </CardHeader>
        <CardContent>
          {departmentData.length > 0 ? (
            <ChartContainer config={departmentChartConfig} className="h-[260px] w-full">
              <BarChart
                data={departmentData}
                layout="vertical"
                margin={{ left: 8, right: 32, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  dataKey="department"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={130}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => (v.length > 18 ? v.slice(0, 18) + "…" : v)}
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="count" name="Journals" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {departmentData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyChart />
          )}
        </CardContent>
      </Card>

      {/* ── Row 6: Quick badge summary ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="outline" className="gap-1.5 py-1 px-2.5 font-normal">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {stats.publicCount} public
        </Badge>
        <Badge variant="outline" className="gap-1.5 py-1 px-2.5 font-normal">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          {stats.privateCount} private
        </Badge>
        {stats.avgImpactFactor !== null && (
          <Badge variant="outline" className="gap-1.5 py-1 px-2.5 font-normal">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            Avg IF {stats.avgImpactFactor.toFixed(2)}
          </Badge>
        )}
        {stats.scopeCounts.map(s => (
          <Badge key={s.scope} variant="secondary" className="gap-1 py-1 px-2.5 font-normal">
            {fmtLabel(s.scope)}: {s.count}
          </Badge>
        ))}
      </div>
    </div>
  )
}
