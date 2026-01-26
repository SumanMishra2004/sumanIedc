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
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export const description = "Publication trend area chart with time period selection"

interface TrendData {
  date?: string
  month?: string
  week?: string
  count: number
}

interface CopyrightTimeSeriesChartProps {
  monthlyTrend: Array<{ month: string; count: number }>
  dailyTrend: Array<{ date: string; count: number }>
  weeklyTrend: Array<{ week: string; count: number }>
  total: number
}

const chartConfig = {
  count: {
    label: "Copyrights",
    color: "var(--chart-1)",
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

export function CopyrightTimeSeriesChart({ monthlyTrend, dailyTrend, weeklyTrend, total }: CopyrightTimeSeriesChartProps) {
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly">("monthly")

  // Transform data based on selected time range
  const getChartData = () => {
    switch (timeRange) {
      case "daily":
        return dailyTrend.map(item => ({
          label: formatDate(item.date),
          count: item.count,
        }))
      case "weekly":
        return weeklyTrend.map(item => ({
          label: formatWeek(item.week),
          count: item.count,
        }))
      case "monthly":
      default:
        return monthlyTrend.map(item => ({
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

  return (
    <Card className="flex flex-col border-dashed border-2 border-chart-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Filing Trend</CardTitle>
            <CardDescription className="text-xs">
              Copyrights created over the {getPeriodLabel()}
            </CardDescription>
          </div>
          <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as "daily" | "weekly" | "monthly")} className="w-auto">
            <TabsList className="grid w-full grid-cols-3 h-8">
              <TabsTrigger value="daily" className="text-xs px-2">Daily</TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs px-2">Weekly</TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs px-2">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
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
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <ChartTooltip 
              cursor={{ strokeDasharray: '3 3' }} 
              content={<ChartTooltipContent indicator="line" />} 
            />
            <defs>
              <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
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
              fill="url(#fillCount)"
              fillOpacity={0.4}
              stroke="var(--color-count)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex w-full items-start gap-2 text-xs">
          <div className="grid gap-1">
            <div className="flex items-center gap-2 leading-none font-medium">
              {hasData ? (
                <>
                  {isPositiveTrend ? (
                    <>
                      Trending up by {Math.abs(parseFloat(trend))}% 
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    </>
                  ) : (
                    <>
                      Trending down by {Math.abs(parseFloat(trend))}% 
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    </>
                  )}
                </>
              ) : (
                'No trend data available'
              )}
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              {dateRange}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
