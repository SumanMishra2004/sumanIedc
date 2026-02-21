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
import { GrantInStatus } from "@prisma/client"

export const description = "A radar chart showing grant status distribution"

interface StatusRadarChartProps {
  statusCounts: Record<string, number>
  total: number
}

const chartConfig = {
  count: {
    label: "Grants",
    color: "hsl(var(--chart-2))",
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
  // Transform status data for radar chart (Record to Array)
  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    status: formatStatusName(status),
    count: count,
  }))

  const maxCount = chartData.length > 0 ? Math.max(...chartData.map(s => s.count)) : 0
  const maxStatus = chartData.find(s => s.count === maxCount)

  return (
    <Card className="flex flex-col border-dashed border-2 border-chart-2">
      <CardHeader className="items-center pb-2">
        <CardTitle className="text-base">Status Distribution</CardTitle>
        <CardDescription className="text-xs">Grant status breakdown</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-62.5 w-full"
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
              fill="var(--chart-2)"
              fillOpacity={0.6}
              stroke="var(--chart-2)"
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
              {maxStatus.status}: {maxCount} grants
              <TrendingUp className="h-3 w-3" />
            </>
          )}
        </div>
        <div className="flex items-center gap-2 leading-none text-muted-foreground text-xs">
          Showing status for {total} grants
        </div>
      </CardFooter>
    </Card>
  )
}
