"use client"

import { useEffect, useState, useCallback } from "react"
import {
  GraduationCap,
  FileCheck,
  Clock,
  AlertCircle,
} from "lucide-react"
import { Pie, PieChart, Bar, BarChart, XAxis, YAxis } from "recharts"
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
import { getFDPStats } from "@/lib/research/fdpApi"
import { FDPStatsResponse } from "@/types/fdp"

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

const statusChartConfig: ChartConfig = {
  SUBMITTED: { label: "Submitted", color: "var(--chart-1)" },
  UNDER_REVIEW: { label: "Under Review", color: "var(--chart-2)" },
  APPROVED: { label: "Approved", color: "var(--chart-3)" },
}

const trendChartConfig: ChartConfig = {
  count: { label: "FDPs Completed", color: "var(--chart-2)" },
}

export default function AdminFDPStats() {
  const [stats, setStats] = useState<FDPStatsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    const response = await getFDPStats()
    if (response.data) {
      setStats(response.data)
    } else if (response.error) {
      toast.error("Failed to load FDP statistics", {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  if (!stats) return null

  const totalCount = stats.total
  const approvedCount = stats.approved
  const underReviewCount = stats.underReview
  const submittedCount = stats.submitted

  const statusData = [
    { status: "SUBMITTED", count: submittedCount, fill: CHART_COLORS[0] },
    { status: "UNDER_REVIEW", count: underReviewCount, fill: CHART_COLORS[1] },
    { status: "APPROVED", count: approvedCount, fill: CHART_COLORS[2] },
  ].filter(item => item.count > 0)

  const trendData = stats.monthWiseCounts || []

  const statCards = [
    {
      title: "Total FDPs",
      value: totalCount,
      subtitle: "FDP records overall",
      icon: GraduationCap,
      gradient: "from-orange-500/10 to-orange-600/5",
      border: "border-orange-200/50"
    },
    {
      title: "Approved",
      value: approvedCount,
      subtitle: "Verified & approved",
      icon: FileCheck,
      gradient: "from-emerald-500/10 to-emerald-600/5",
      border: "border-emerald-200/50"
    },
    {
      title: "Under Review",
      value: underReviewCount,
      subtitle: "Awaiting review",
      icon: Clock,
      gradient: "from-amber-500/10 to-amber-600/5",
      border: "border-amber-200/50"
    },
    {
      title: "Submitted",
      value: submittedCount,
      subtitle: "Recently uploaded",
      icon: AlertCircle,
      gradient: "from-blue-500/10 to-blue-600/5",
      border: "border-blue-200/50"
    },
  ]

  return (
    <div className="space-y-4">
      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card
            key={card.title}
            className={`border-dashed border-2 ${card.border} bg-gradient-to-br ${card.gradient} transition-shadow hover:shadow-md`}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Status Distribution
            </CardTitle>
            <CardDescription>FDPs by verification stage</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ChartContainer
                config={statusChartConfig}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="status"
                    label={({ status, count }) =>
                      `${formatEnumLabel(status)}: ${count}`
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

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              FDP Date Trend
            </CardTitle>
            <CardDescription>FDP occurrences over time</CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <ChartContainer
                config={trendChartConfig}
                className="mx-auto max-h-[250px]"
              >
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="count" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
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
