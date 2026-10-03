"use client"

import * as React from "react"
import { BookOpen, ShieldAlert, Eye, Edit3, ShieldCheck } from "lucide-react"
import { useSession } from "next-auth/react"

import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import AdminJournalStats from "@/components/admin/journal/AdminJournalStats"
import AdminJournalTable from "@/components/admin/journal/AdminJournalTable"

// ─── Access-control matrix ────────────────────────────────────────────────────
// EDITOR      → stats (EDITOR+ guard on API) + read-only table view + review actions
// ADMIN       → stats + full table (mutate, publish, delete unpublished)
// SUPERADMIN  → everything + force-publish override + delete published + override comment
const ALLOWED_ROLES = ["EDITOR", "ADMIN", "SUPERADMIN"] as const
type AllowedRole = (typeof ALLOWED_ROLES)[number]

function isAllowedRole(role: string | undefined): role is AllowedRole {
  return ALLOWED_ROLES.includes(role as AllowedRole)
}

// ─── Role meta for header badge ───────────────────────────────────────────────
const ROLE_META: Record<AllowedRole, { label: string; icon: React.ElementType; className: string }> = {
  EDITOR: {
    label: "Editor — Read-only",
    icon: Eye,
    className: "border-sky-300 text-sky-700 bg-sky-50 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800",
  },
  ADMIN: {
    label: "Admin",
    icon: Edit3,
    className: "border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  },
  SUPERADMIN: {
    label: "SuperAdmin",
    icon: ShieldCheck,
    className: "border-violet-300 text-violet-700 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800",
  },
}

export default function AdminJournalsPage() {
  const { data: session, status } = useSession()
  const [statsRefreshKey, setStatsRefreshKey] = React.useState(0)

  const handleRefreshStats = React.useCallback(() => {
    setStatsRefreshKey(prev => prev + 1)
  }, [])

  // ── Loading state ─────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="container mx-auto max-w-[1600px] p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-[280px] w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    )
  }

  const role = session?.user?.role ?? ""

  // ── Access denied ─────────────────────────────────────────────────────────
  if (!isAllowedRole(role)) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center flex flex-col items-center justify-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold text-destructive">Access Denied</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This area requires at minimum <span className="font-medium">Editor</span> access.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const meta = ROLE_META[role]
  const RoleIcon = meta.icon

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto max-w-[1600px] p-6 space-y-6">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
            <BookOpen className="h-6 w-6 text-primary" />
            Journal Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {role === "EDITOR"
              ? "Review submissions, update editorial status, and monitor journal analytics."
              : role === "SUPERADMIN"
              ? "Full administrative control including force-publish overrides and published-journal deletion."
              : "Audit, review, verify, publish and manage all journal submissions."}
          </p>
        </div>

        <Badge variant="outline" className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium self-start ${meta.className}`}>
          <RoleIcon className="h-3.5 w-3.5" />
          {meta.label}
        </Badge>
      </div>

      {/* ── Analytics Stats ──────────────────────────────────────────────── */}
      {/* Stats API is EDITOR+ — all three roles can see this */}
      <AdminJournalStats key={statsRefreshKey} />

      {/* ── Main Table ───────────────────────────────────────────────────── */}
      {/* Pass userRole so the table can gate destructive actions client-side.
          Server APIs still enforce their own guards — this is UX-only gating. */}
      <AdminJournalTable
        userRole={role}
        onRefresh={handleRefreshStats}
      />
    </div>
  )
}
