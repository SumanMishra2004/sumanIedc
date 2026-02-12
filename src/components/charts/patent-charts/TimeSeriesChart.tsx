"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useState } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const description = "Patent date trend area chart with time period and date type selection"

type DateType = "filing" | "submission" | "publication" | "grant"
type TimeRange = "daily" | "weekly" | "monthly"

interface PatentTimeSeriesChartProps {
  filingDateTrends: {
    monthlyTrend: Array<{ month: string; count: number }>
    dailyTrend: Array<{ date: string; count: number }>
    weeklyTrend: Array<{ week: string; count: number }>
  }
  submissionDateTrends: {
    monthlyTrend: Array<{ month: string; count: number }>
    dailyTrend: Array<{ date: string; count: number }>
    weeklyTrend: Array<{ week: string; count: number }>
  }
  publicationDateTrends: {
    monthlyTrend: Array<{ month: string; count: number }>
    dailyTrend: Array<{ date: string; count: number }>
    weeklyTrend: Array<{ week: string; count: number }>
  }
  grantDateTrends: {
    monthlyTrend: Array<{ month: string; count: number }>
    dailyTrend: Array<{ date: string; count: number }>
    weeklyTrend: Array<{ week: string; count: number }>
  }
}

const chartConfig = {
  count: {
    label: "Patents",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatWeek(weekStr: string): string {
  const [year, week] = weekStr.split('-W')
  return `W${week} '${year.slice(2)}`
}

export function PatentTimeSeriesChart({ 
  filingDateTrends, 
  submissionDateTrends, 
  publicationDateTrends, 
  grantDateTrends
}: PatentTimeSeriesChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("monthly")
  const [dateType, setDateType] = useState<DateType>("filing")
    console.log("Trends data:", {
    filingDateTrends,
    submissionDateTrends,
    publicationDateTrends,
    grantDateTrends
  })
  // Get the appropriate trends based on date type
  const getCurrentTrends = () => {
    switch (dateType) {
      case "filing":
        return filingDateTrends
      case "submission":
        return submissionDateTrends
      case "publication":
        return publicationDateTrends
      case "grant":
        return grantDateTrends
    }
  }

  const currentTrends = getCurrentTrends()

  // Transform data based on selected time range
  const getChartData = () => {
    switch (timeRange) {
      case "daily":
        return currentTrends.dailyTrend.map(item => ({
          label: formatDate(item.date),
          count: item.count,
        }))
      case "weekly":
        return currentTrends.weeklyTrend.map(item => ({
          label: formatWeek(item.week),
          count: item.count,
        }))
      case "monthly":
      default:
        return currentTrends.monthlyTrend.map(item => ({
          label: formatMonth(item.month),
          count: item.count,
        }))
    }
  }

  const chartData = getChartData()

  // Calculate trend
  const hasData = chartData.length >= 2
  const latestCount = hasData ? chartData[chartData.length - 1].count : 0
  const previousCount = hasData ? chartData[chartData.length - 2].count : 0
  const trend = previousCount > 0 
    ? ((latestCount - previousCount) / previousCount * 100).toFixed(1)
    : '0'
  const isPositiveTrend = parseFloat(trend) >= 0

  // Get date range
  const dateRange = hasData 
    ? `${chartData[0].label} - ${chartData[chartData.length - 1].label}`
    : 'No data available'

  const getPeriodLabel = () => {
    switch (timeRange) {
      case "daily": return "last 30 days"
      case "weekly": return "last 12 weeks"
      case "monthly": return "last 12 months"
    }
  }

  const getDateTypeLabel = () => {
    switch (dateType) {
      case "filing": return "Filing Date"
      case "submission": return "Submission Date"
      case "publication": return "Publication Date"
      case "grant": return "Grant Date"
    }
  }

  return (
    <Card className="flex flex-col border-dashed border-2 border-chart-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex-1 min-w-45">
            <CardTitle className="text-base">Patent Trend</CardTitle>
            <CardDescription className="text-xs">
              Patents by {getDateTypeLabel().toLowerCase()} over the {getPeriodLabel()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateType} onValueChange={(value) => setDateType(value as DateType)}>
              <SelectTrigger className="w-35 h-8 text-xs">
                <SelectValue placeholder="Select date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="filing">Filing Date</SelectItem>
                <SelectItem value="submission">Submission Date</SelectItem>
                <SelectItem value="publication">Publication Date</SelectItem>
                <SelectItem value="grant">Grant Date</SelectItem>
              </SelectContent>
            </Select>
            <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)} className="w-auto">
              <TabsList className="grid w-full grid-cols-3 h-8">
                <TabsTrigger value="daily" className="text-xs px-2">Daily</TabsTrigger>
                <TabsTrigger value="weekly" className="text-xs px-2">7 Days</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs px-2">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 0,
              right: 12,
              top: 5,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
              width={30}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <defs>
              <linearGradient id="fillPatents" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-count)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-count)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="count"
              type="monotone"
              fill="url(#fillPatents)"
              fillOpacity={0.4}
              stroke="var(--color-count)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-1.5 text-sm pt-2">
        <div className="flex items-center gap-2 leading-none font-medium text-xs">
          Trending {isPositiveTrend ? 'up' : 'down'} by {Math.abs(parseFloat(trend))}% this period
          {isPositiveTrend ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
        </div>
        <div className="text-muted-foreground leading-none text-xs">
          {dateRange}
        </div>
      </CardFooter>
    </Card>
  )
}
