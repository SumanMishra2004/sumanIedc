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

interface ChartAreaGradientProps {
  monthlyTrend: Array<{ month: string; count: number }>
  dailyTrend: Array<{ date: string; count: number }>
  weeklyTrend: Array<{ week: string; count: number }>
  total: number
}

const chartConfig = {
  count: {
    label: "Conferences",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function ChartAreaGradient({ 
  monthlyTrend = [], 
  dailyTrend = [], 
  weeklyTrend = [],
  total 
}: ChartAreaGradientProps) {
  const [activeTab, setActiveTab] = useState("monthly")

  // Function to calculate percentage change
  const calculateChange = (data: TrendData[]) => {
    if (data.length < 2) return 0
    const last = data[data.length - 1].count
    const previous = data[data.length - 2].count
    if (previous === 0) return last > 0 ? 100 : 0
    return ((last - previous) / previous) * 100
  }

  const getCurrentData = () => {
    switch(activeTab) {
      case "daily": return dailyTrend
      case "weekly": return weeklyTrend
      case "monthly": 
      default: return monthlyTrend
    }
  }

  const currentData = getCurrentData()
  const change = calculateChange(currentData)
  const isPositive = change >= 0

  return (
    <Card className="flex flex-col border-dashed border-2 border-chart-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Publication Activity</CardTitle>
            <CardDescription>
              Showing conference publication trends over time
            </CardDescription>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-75">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-50 w-full">
          <AreaChart
            accessibilityLayer
            data={currentData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={activeTab === "monthly" ? "month" : activeTab === "weekly" ? "week" : "date"}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const date = new Date(value)
                return activeTab === "monthly" 
                  ? date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
                  : activeTab === "weekly"
                  ? value
                  : date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              }}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              dataKey="count"
              type="natural"
              fill="url(#fillCount)"
              fillOpacity={0.4}
              stroke="var(--chart-2)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              {isPositive ? "Trending up" : "Trending down"} by {Math.abs(change).toFixed(1)}% this period{" "}
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              Total count: {total}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
