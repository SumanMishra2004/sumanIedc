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
import { ConferenceStatus } from "@prisma/client"

export const description = "A radar chart showing status distribution"

interface StatusRadarChartProps {
  statusCounts: Array<{
    status: ConferenceStatus
    count: number
  }>
  total: number
}

const chartConfig = {
  count: {
    label: "Conferences",
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
    count: item.count
  }))

  return (
    <Card className="flex flex-col border-dashed border-2 border-chart-2">
      <CardHeader className="items-center">
        <CardTitle>Conference Status</CardTitle>
        <CardDescription>
          Distribution of conference across statuses
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-50"
        >
          <RadarChart data={chartData}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <PolarGrid className="fill-[--color-desktop] opacity-20" />
            <PolarAngleAxis dataKey="status" />
            <Radar
              dataKey="count"
              fill="var(--color-count)"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Total Conferences: {total} <TrendingUp className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-2 leading-none text-muted-foreground">
          Showing status distribution
        </div>
      </CardFooter>
    </Card>
  )
}
