"use client"

import { useEffect, useState, useCallback } from "react"
import {
  BookOpen,
  FileCheck,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { Pie, PieChart, Bar, BarChart, XAxis, YAxis, Cell } from "recharts"
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
import { toast } from "sonner"
import {
  getAdminJournalStats,
  type AdminJournalStatsResponse,
} from "@/lib/admin/adminJournalApi"

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "oklch(0.7 0.15 200)",
  "oklch(0.65 0.18 320)",
  "oklch(0.75 0.12 60)",
]

const indexingChartConfig: ChartConfig = {
  SCOPUS: { label: "Scopus", color: "var(--chart-1)" },
  SCI: { label: "SCI", color: "var(--chart-2)" },
  UGC_CARE: { label: "UGC Care", color: "var(--chart-3)" },
  WEB_OF_SCIENCE: { label: "Web of Science", color: "var(--chart-4)" },
  PUBMED: { label: "PubMed", color: "var(--chart-5)" },
  IEEE: { label: "IEEE", color: "oklch(0.7 0.15 200)" },
  OTHER: { label: "Other", color: "oklch(0.65 0.18 320)" },
  NONE: { label: "None", color: "oklch(0.75 0.12 60)" },
}

const quartileChartConfig: ChartConfig = {
  Q1: { label: "Q1", color: "var(--chart-1)" },
  Q2: { label: "Q2", color: "var(--chart-2)" },
  Q3: { label: "Q3", color: "var(--chart-3)" },
  Q4: { label: "Q4", color: "var(--chart-4)" },
  NOT_APPLICABLE: { label: "N/A", color: "var(--chart-5)" },
}

const departmentChartConfig: ChartConfig = {
  count: { label: "Journals", color: "var(--chart-2)" },
}

export default function AdminJournalStats() {
  const [stats, setStats] = useState<AdminJournalStatsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    const response = await getAdminJournalStats()
    if (response.data) {
      setStats(response.data)
    } else if (response.error) {
      toast.error("Failed to load journal statistics", {
        description: response.error,
      })
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    const id = setTimeout(() => {
      void fetchStats()
    }, 0)
    return () => clearTimeout(id)
  }, [fetchStats])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  if (!stats) return null

  const publishedCount =
    stats.journalStatusCounts.find((s) => s.status === "PUBLISHED")?.count || 0
  const underReviewCount =
    stats.journalStatusCounts.find((s) => s.status === "UNDER_REVIEW")?.count || 0
  const rejectedCount =
    stats.teacherStatusCounts.find((s) => s.status === "REJECTED")?.count || 0
  const pendingCount =
    stats.teacherStatusCounts.find((s) => s.status === "UPLOADED")?.count || 0

  const indexingData = stats.indexingCounts.map((item, idx) => ({
    indexing: item.indexing,
    count: item.count,
    fill: CHART_COLORS[idx % CHART_COLORS.length],
  }))

  const quartileData = stats.quartileCounts.map((item, idx) => ({
    quartile: item.quartile,
    count: item.count,
    fill: CHART_COLORS[idx % CHART_COLORS.length],
  }))

  const departmentData = stats.departmentCounts
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const statCards = [
    {
      title: "Total Journals",
      value: stats.total,
      subtitle: `${stats.publicCount} public, ${stats.privateCount} private`,
      icon: BookOpen,
      gradient: "from-blue-500/10 to-blue-600/5",
    },
    {
      title: "Published",
      value: publishedCount,
      subtitle: "Successfully published",
      icon: FileCheck,
      gradient: "from-emerald-500/10 to-emerald-600/5",
    },
    {
      title: "Under Review",
      value: underReviewCount,
      subtitle: "Awaiting review",
      icon: Clock,
      gradient: "from-amber-500/10 to-amber-600/5",
    },
    {
      title: "Rejected",
      value: rejectedCount,
      subtitle: "Teacher rejected",
      icon: XCircle,
      gradient: "from-red-500/10 to-red-600/5",
    },
    {
      title: "Pending Review",
      value: pendingCount,
      subtitle: "Uploaded, awaiting action",
      icon: AlertCircle,
      gradient: "from-violet-500/10 to-violet-600/5",
    },
  ]

  return (
    <div className="space-y-4">
      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <Card
            key={card.title}
            className={`border-dashed border-2 border-chart-2 bg-gradient-to-br ${card.gradient} transition-shadow hover:shadow-md`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.subtitle}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Indexing Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Indexing Distribution
            </CardTitle>
            <CardDescription>Journals by indexing type</CardDescription>
          </CardHeader>
          <CardContent>
            {indexingData.length > 0 ? (
              <ChartContainer
                config={indexingChartConfig}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={indexingData}
                    dataKey="count"
                    nameKey="indexing"
                    label={({ indexing, count }) =>
                      `${formatEnumLabel(indexing)}: ${count}`
                    }
                    labelLine={false}
                    innerRadius={40}
                    strokeWidth={2}
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quartile Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Quartile Distribution
            </CardTitle>
            <CardDescription>Q1 through Q4 breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {quartileData.length > 0 ? (
              <ChartContainer
                config={quartileChartConfig}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={quartileData}
                    dataKey="count"
                    nameKey="quartile"
                    label={({ quartile, count }) =>
                      `${formatEnumLabel(quartile)}: ${count}`
                    }
                    labelLine={false}
                    innerRadius={40}
                    strokeWidth={2}
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Department Breakdown
            </CardTitle>
            <CardDescription>Top departments by journal count</CardDescription>
          </CardHeader>
          <CardContent>
            {departmentData.length > 0 ? (
              <ChartContainer
                config={departmentChartConfig}
                className="mx-auto max-h-[250px]"
              >
                <BarChart
                  data={departmentData}
                  layout="vertical"
                  margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="department"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={100}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) =>
                      v.length > 14 ? v.slice(0, 14) + "…" : v
                    }
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {departmentData.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={CHART_COLORS[idx % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function formatEnumLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
