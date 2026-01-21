"use client"

import { Pie, PieChart } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Users } from "lucide-react"

interface SpecialUser {
  id: string
  email: string
  role: string
  createdAt?: string
}

interface SpecialUserChartProps {
  data: SpecialUser[]
}

const chartConfig = {
  
  FACULTY: {
    label: "Faculty",
    color: "var(--chart-2)",
  },
  ADMIN: {
    label: "Admin",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

export function SpecialUserChart({ data }: SpecialUserChartProps) {
  // Count users by role
  const roleCounts = data.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const chartData = [
    
    { 
      role: "FACULTY", 
      count: roleCounts.FACULTY || 0, 
      fill: "var(--color-FACULTY)" 
    },
    { 
      role: "ADMIN", 
      count: roleCounts.ADMIN || 0, 
      fill: "var(--color-ADMIN)" 
    },
  ].filter(item => item.count > 0)

  const totalUsers = data.length

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Special Users Overview
        </CardTitle>
        <CardDescription>
          Distribution of users by role
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie 
              data={chartData} 
              dataKey="count" 
              nameKey="role"
              label
            />
          </PieChart>
        </ChartContainer>
        <div className="mt-6 flex justify-around text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold">{roleCounts.STUDENT || 0}</div>
            <div className="text-muted-foreground">Students</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{roleCounts.FACULTY || 0}</div>
            <div className="text-muted-foreground">Faculty</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{roleCounts.ADMIN || 0}</div>
            <div className="text-muted-foreground">Admins</div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{totalUsers}</span> users
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
        