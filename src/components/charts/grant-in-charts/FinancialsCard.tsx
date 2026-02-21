"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { GrantStatsResponse } from "@/types/grant-in"

interface FinancialsCardProps {
  financials: GrantStatsResponse["financials"]
  className?: string
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n)

export function FinancialsCard({ financials, className }: FinancialsCardProps) {
  const { totalAmountGranted, totalUsedAmount, avgAmountGranted, avgUsedAmount } =
    financials

  const utilization =
    totalAmountGranted > 0
      ? Math.min(100, Math.round((totalUsedAmount / totalAmountGranted) * 100))
      : 0

  const remaining = Math.max(0, totalAmountGranted - totalUsedAmount)

  return (
    <Card className={`border-dashed border-2 ${className ?? ""}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Utilization bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Used vs Granted</span>
            <span className="font-semibold text-foreground">{utilization}%</span>
          </div>
          <Progress value={utilization} className="h-3" />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span className="text-emerald-600 font-medium">{fmt(totalAmountGranted)} granted</span>
            <span className="text-orange-500 font-medium">{fmt(totalUsedAmount)} used</span>
          </div>
        </div>

        {/* Remaining */}
        <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
          <span className="text-sm text-muted-foreground">Remaining Budget</span>
          <span className="font-bold text-blue-600">{fmt(remaining)}</span>
        </div>

        {/* Averages */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Avg Granted</p>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-sm font-semibold">{fmt(avgAmountGranted)}</span>
            </div>
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Avg Used</p>
            <div className="flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-sm font-semibold">{fmt(avgUsedAmount)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
