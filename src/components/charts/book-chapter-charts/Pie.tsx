"use client"

import { TrendingUp } from "lucide-react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

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
import { ResearchStatus } from "@prisma/client"

export const description = "A radar chart showing status distribution"

interface StatusRadarChartProps {
  statusCounts: Array<{
    status: ResearchStatus
    count: number
  }>
  total: number
}

const chartConfig = {
  count: {
    label: "Chapters",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const formatStatusName = (status: string) => {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function StatusRadarChart({ statusCounts, total }: StatusRadarChartProps) {
  // Transform status data for radar chart
  const chartData = statusCounts.map(item => ({
    status: formatStatusName(item.status),
    count: item.count,
  }))

  // Find the highest count for trending
  const maxCount = Math.max(...statusCounts.map(s => s.count))
  const maxStatus = statusCounts.find(s => s.count === maxCount)

  return (
    <Card className="flex flex-col border-dashed border-2 border-chart-2">
      <CardHeader className="items-center pb-2">
        <CardTitle className="text-base">Status Distribution</CardTitle>
        <CardDescription className="text-xs">Chapter status breakdown</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[200px] w-full"
        >
          <RadarChart data={chartData}>
            <ChartTooltip 
              cursor={false} 
              content={<ChartTooltipContent indicator="line" />} 
            />
            <PolarAngleAxis 
              dataKey="status"
              tick={{ fontSize: 10 }}
            />
            <PolarGrid />
            <Radar
              dataKey="count"
              fill="var(--color-count)"
              fillOpacity={0.6}
              stroke="var(--color-count)"
              strokeWidth={2}
              dot={{
                r: 4,
                fillOpacity: 1,
              }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-1.5 text-sm pt-2">
        <div className="flex items-center gap-2 leading-none font-medium text-xs">
          {maxStatus && (
            <>
              {formatStatusName(maxStatus.status)}: {maxCount} chapters
              <TrendingUp className="h-3 w-3" />
            </>
          )}
        </div>
        <div className="text-muted-foreground leading-none text-xs">
          Total {total} chapters across {statusCounts.length} statuses
        </div>
      </CardFooter>
    </Card>
  )
}
