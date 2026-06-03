"use client"

import * as React from "react"
import { BookOpen, ShieldAlert } from "lucide-react"
import { useSession } from "next-auth/react"

import { Skeleton } from "@/components/ui/skeleton"
import AdminJournalStats from "@/components/admin/journal/AdminJournalStats"
import AdminJournalTable from "@/components/admin/journal/AdminJournalTable"

export default function AdminJournalsPage() {
  const { data: session, status } = useSession()
  const [statsRefreshKey, setStatsRefreshKey] = React.useState(0)

  const handleRefreshStats = React.useCallback(() => {
    setStatsRefreshKey((prev) => prev + 1)
  }, [])

  if (status === "loading") {
    return (
      <div className="container mx-auto max-w-[1600px] p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    )
  }

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center flex flex-col items-center justify-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold text-destructive">Access Denied</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This area is restricted to system administrators.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-[1600px] p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
          <BookOpen className="h-6 w-6 text-primary" />
          Journal Management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Audit, review, verify, publish and manage all journal submissions.
        </p>
      </div>

      {/* Analytics Stats */}
      <AdminJournalStats key={statsRefreshKey} />

      {/* Main Table */}
      <AdminJournalTable onRefresh={handleRefreshStats} />
    </div>
  )
}
