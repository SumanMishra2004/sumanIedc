"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  Search,
  Trash2,
  X,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Zap,
  Lock,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import AdminJournalFilters, { JournalFilterValues } from "./AdminJournalFilters"
import AdminJournalDetail from "./AdminJournalDetail"
import {
  getAdminJournals,
  updateAdminJournal,
  deleteAdminJournal,
  bulkDeleteAdminJournals,
} from "@/lib/admin/adminJournalApi"
import { Journal, JournalFilters } from "@/types/journal"

// ─── Role helpers ─────────────────────────────────────────────────────────────
function isAdminOrHigher(role: string) {
  return role === "ADMIN" || role === "SUPERADMIN"
}
function isSuperAdmin(role: string) {
  return role === "SUPERADMIN"
}
function isEditorRole(role: string) {
  return role === "EDITOR"
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface AdminJournalTableProps {
  /** The authenticated user's role — gates destructive actions and SUPERADMIN extras */
  userRole: string
  onRefresh?: () => void
}

// ─── Status colour maps ───────────────────────────────────────────────────────
const teacherStatusColors: Record<string, string> = {
  UPLOADED:  "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  ACCEPTED:  "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  UPDATE:    "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  REJECTED:  "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  PUBLISHED: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
}

const journalStatusColors: Record<string, string> = {
  SUBMITTED:    "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  APPROVED:     "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  PUBLISHED:    "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
}

function formatLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminJournalTable({ userRole, onRefresh }: AdminJournalTableProps) {
  // ── Query state ──────────────────────────────────────────────────────────────
  const [filters, setFilters] = React.useState<JournalFilterValues>({})
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)
  const [sortBy, setSortBy] = React.useState("createdAt")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")

  // ── Data state ───────────────────────────────────────────────────────────────
  const [journals, setJournals] = React.useState<Journal[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [totalPages, setTotalPages] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(true)
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({})

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [activeJournal, setActiveJournal] = React.useState<Journal | null>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)

  // Delete
  const [deleteJournalId, setDeleteJournalId] = React.useState<string | null>(null)
  const [deleteIsPublished, setDeleteIsPublished] = React.useState(false)

  // Status confirmation
  const [confirmStatusData, setConfirmStatusData] = React.useState<{
    id: string
    teacherStatus: string
    journalStatus?: string
  } | null>(null)

  // Bulk delete
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false)

  // SUPERADMIN: force-publish override dialog
  const [forcePublishJournal, setForcePublishJournal] = React.useState<Journal | null>(null)
  const [forcePublishReason, setForcePublishReason] = React.useState("")

  // SUPERADMIN: update-comment override dialog
  const [overrideCommentJournal, setOverrideCommentJournal] = React.useState<Journal | null>(null)
  const [overrideComment, setOverrideComment] = React.useState("")

  const [isActionLoading, setIsActionLoading] = React.useState(false)

  // ── Role flags ────────────────────────────────────────────────────────────────
  const canMutate       = isAdminOrHigher(userRole)   // ADMIN and SUPERADMIN
  const canForceSA      = isSuperAdmin(userRole)       // SUPERADMIN only
  const isEditorOnly    = isEditorRole(userRole)       // EDITOR — read-only + review

  // ── Debounce search ──────────────────────────────────────────────────────────
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  // ── Fetch journals ───────────────────────────────────────────────────────────
  const fetchJournals = React.useCallback(async () => {
    setIsLoading(true)
    const res = await getAdminJournals({
      page, limit, sortBy, sortOrder,
      search: debouncedSearch,
      ...filters,
    } as JournalFilters)
    setIsLoading(false)
    if (res.data) {
      setJournals(res.data.journals)
      setTotalCount(res.data.pagination.total)
      setTotalPages(res.data.pagination.totalPages)
    } else if (res.error) {
      toast.error("Failed to load journals", { description: res.error })
    }
  }, [page, limit, sortBy, sortOrder, debouncedSearch, filters])

  React.useEffect(() => { void fetchJournals() }, [fetchJournals])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleFilterChange = (key: keyof JournalFilterValues, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleClearFilters = () => {
    setFilters({})
    setSearch("")
    setPage(1)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) setSortOrder(o => o === "asc" ? "desc" : "asc")
    else { setSortBy(field); setSortOrder("desc") }
    setPage(1)
  }

  const handleStatusConfirm = async () => {
    if (!confirmStatusData) return
    setIsActionLoading(true)
    const { id, teacherStatus, journalStatus } = confirmStatusData
    const res = await updateAdminJournal(id, { teacherStatus, journalStatus })
    setIsActionLoading(false)
    setConfirmStatusData(null)
    if (res.data) {
      toast.success("Journal status updated")
      void fetchJournals()
      onRefresh?.()
    } else {
      toast.error(res.error || "Failed to update status")
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteJournalId) return
    setIsActionLoading(true)
    const res = await deleteAdminJournal(deleteJournalId)
    setIsActionLoading(false)
    setDeleteJournalId(null)
    if (res.data) {
      toast.success("Journal deleted")
      void fetchJournals()
      onRefresh?.()
    } else {
      toast.error(res.error || "Failed to delete journal")
    }
  }

  const handleBulkDelete = async () => {
    const ids = Object.keys(rowSelection).filter(k => rowSelection[k])
    if (!ids.length) return
    setIsActionLoading(true)
    const res = await bulkDeleteAdminJournals(ids)
    setIsActionLoading(false)
    setIsBulkDeleteOpen(false)
    if (res.data) {
      toast.success(`Deleted ${res.data.count} journal(s)`)
      setRowSelection({})
      void fetchJournals()
      onRefresh?.()
    } else {
      toast.error(res.error || "Bulk delete failed")
    }
  }

  const handleTogglePublic = async (id: string, currentPublic: boolean) => {
    const res = await updateAdminJournal(id, { isPublic: !currentPublic })
    if (res.data) {
      toast.success(`Visibility set to ${!currentPublic ? "Public" : "Private"}`)
      void fetchJournals()
      onRefresh?.()
    } else {
      toast.error(res.error || "Failed to update visibility")
    }
  }

  // SUPERADMIN: force-publish (bypass PI accepted requirement)
  const handleForcePublish = async () => {
    if (!forcePublishJournal || !forcePublishReason.trim()) return
    setIsActionLoading(true)
    const res = await updateAdminJournal(forcePublishJournal.id, {
      teacherStatus: "PUBLISHED",
      journalStatus: "PUBLISHED",
      isPublic: true,
      updateComment: `[SUPERADMIN OVERRIDE] ${forcePublishReason.trim()}`,
    })
    setIsActionLoading(false)
    setForcePublishJournal(null)
    setForcePublishReason("")
    if (res.data) {
      toast.success("Journal force-published by SUPERADMIN override")
      void fetchJournals()
      onRefresh?.()
    } else {
      toast.error(res.error || "Force-publish failed")
    }
  }

  // SUPERADMIN: set update comment override (visible to authors)
  const handleOverrideComment = async () => {
    if (!overrideCommentJournal || !overrideComment.trim()) return
    setIsActionLoading(true)
    const res = await updateAdminJournal(overrideCommentJournal.id, {
      updateComment: overrideComment.trim(),
      teacherStatus: "UPDATE",
      journalStatus: "UNDER_REVIEW",
    })
    setIsActionLoading(false)
    setOverrideCommentJournal(null)
    setOverrideComment("")
    if (res.data) {
      toast.success("Override comment set — authors will see it on their next view")
      void fetchJournals()
      onRefresh?.()
    } else {
      toast.error(res.error || "Failed to set override comment")
    }
  }

  // ── Columns ───────────────────────────────────────────────────────────────────
  const columns: ColumnDef<Journal>[] = [
    // Checkbox only for ADMIN+ (bulk delete is destructive)
    ...(canMutate ? [{
      id: "select",
      header: ({ table }: any) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(v: boolean) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }: any) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v: boolean) => row.toggleSelected(!!v)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
    }] : []),

    {
      accessorKey: "title",
      header: () => (
        <Button variant="ghost" className="p-0 hover:bg-transparent" onClick={() => handleSort("title")}>
          Title <ArrowUpDown className="ml-2 h-4 w-4 shrink-0" />
        </Button>
      ),
      cell: ({ row }) => {
        const title = row.getValue("title") as string
        return (
          <div className="max-w-[300px] sm:max-w-[380px]">
            <div className="font-semibold text-sm leading-snug line-clamp-2" title={title}>
              {title}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 font-mono">
              {row.original.serialNo}
            </div>
            {/* Show update comment inline if present */}
            {row.original.updateComment && (
              <div className="mt-1 flex items-start gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{row.original.updateComment}</span>
              </div>
            )}
          </div>
        )
      },
    },

    {
      accessorKey: "journalName",
      header: () => (
        <Button variant="ghost" className="p-0 hover:bg-transparent" onClick={() => handleSort("journalName")}>
          Journal <ArrowUpDown className="ml-2 h-4 w-4 shrink-0" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="max-w-[180px] truncate text-xs sm:text-sm font-medium">
          {row.getValue("journalName")}
        </div>
      ),
    },

    {
      id: "submittedBy",
      header: "Submitted By",
      cell: ({ row }) => {
        const fac = row.original.facultyAuthors?.[0]?.user
        const stu = row.original.studentAuthors?.[0]?.user
        const author = fac || stu
        if (!author) return <span className="text-muted-foreground italic text-xs">Unknown</span>
        return (
          <div>
            <div className="font-medium text-xs truncate max-w-[140px]">{author.name || "Unnamed"}</div>
            <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">
              {fac ? "Faculty" : "Student"} · {(author as any).department || "N/A"}
            </div>
          </div>
        )
      },
    },

    {
      accessorKey: "publicationDate",
      header: () => (
        <Button variant="ghost" className="p-0 hover:bg-transparent" onClick={() => handleSort("publicationDate")}>
          Date <ArrowUpDown className="ml-2 h-4 w-4 shrink-0" />
        </Button>
      ),
      cell: ({ row }) => {
        const d = (row.getValue("publicationDate") as string | null) || row.original.createdAt
        return (
          <div className="text-xs font-medium whitespace-nowrap">
            {new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
          </div>
        )
      },
    },

    {
      accessorKey: "teacherStatus",
      header: "PI Status",
      cell: ({ row }) => {
        const s = row.getValue("teacherStatus") as string
        return (
          <Badge variant="outline" className={`${teacherStatusColors[s]} capitalize text-[11px] font-medium whitespace-nowrap`}>
            {formatLabel(s)}
          </Badge>
        )
      },
    },

    {
      accessorKey: "journalStatus",
      header: "Editorial",
      cell: ({ row }) => {
        const s = row.getValue("journalStatus") as string
        return (
          <Badge variant="outline" className={`${journalStatusColors[s]} capitalize text-[11px] font-medium whitespace-nowrap`}>
            {formatLabel(s)}
          </Badge>
        )
      },
    },

    {
      accessorKey: "indexing",
      header: "Indexing",
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-[10px] font-semibold">
          {row.getValue("indexing") as string}
        </Badge>
      ),
    },

    {
      id: "visibility",
      header: "Visibility",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.isPublic
              ? "text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 text-[10px]"
              : "text-slate-500 border-slate-300 bg-slate-50 dark:bg-slate-800 text-[10px]"
          }
        >
          {row.original.isPublic ? "Public" : "Private"}
        </Badge>
      ),
    },

    {
      id: "actions",
      header: () => <div className="text-right pr-2">Actions</div>,
      cell: ({ row }) => {
        const journal = row.original
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2 text-xs">
                  Actions
                  {/* Role indicator badge */}
                  {isEditorOnly && (
                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5 ml-auto">
                      Read-only
                    </Badge>
                  )}
                  {canForceSA && (
                    <Badge className="text-[9px] h-4 px-1.5 ml-auto bg-violet-600 text-white">
                      SUPERADMIN
                    </Badge>
                  )}
                </DropdownMenuLabel>

                {/* ── View (all roles) ─────────────────────────────────────── */}
                <DropdownMenuItem
                  onClick={() => { setActiveJournal(journal); setIsDetailOpen(true) }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details{canMutate ? " & Edit" : ""}
                </DropdownMenuItem>

                {journal.documentUrl && (
                  <DropdownMenuItem asChild>
                    <a href={journal.documentUrl} target="_blank" rel="noreferrer" className="flex items-center w-full">
                      <FileText className="mr-2 h-4 w-4" />
                      Open PDF <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
                    </a>
                  </DropdownMenuItem>
                )}

                {/* ── Review actions (EDITOR + ADMIN + SUPERADMIN) ─────────── */}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] text-muted-foreground font-normal py-0">
                  Review Decision
                </DropdownMenuLabel>

                <DropdownMenuItem
                  disabled={journal.teacherStatus === "ACCEPTED"}
                  onClick={() => setConfirmStatusData({
                    id: journal.id,
                    teacherStatus: "ACCEPTED",
                    journalStatus: "APPROVED",
                  })}
                >
                  <Check className="mr-2 h-4 w-4 text-emerald-600" />
                  Accept Submission
                </DropdownMenuItem>

                <DropdownMenuItem
                  disabled={journal.teacherStatus === "UPDATE"}
                  onClick={() => setConfirmStatusData({
                    id: journal.id,
                    teacherStatus: "UPDATE",
                    journalStatus: "UNDER_REVIEW",
                  })}
                >
                  <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                  Request Updates
                </DropdownMenuItem>

                <DropdownMenuItem
                  disabled={journal.teacherStatus === "REJECTED"}
                  className="text-red-600 focus:text-red-600"
                  onClick={() => setConfirmStatusData({
                    id: journal.id,
                    teacherStatus: "REJECTED",
                  })}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject Submission
                </DropdownMenuItem>

                {/* ── Publish (ADMIN+ only) ────────────────────────────────── */}
                {canMutate && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[10px] text-muted-foreground font-normal py-0">
                      Publication
                    </DropdownMenuLabel>

                    <DropdownMenuItem
                      disabled={journal.teacherStatus !== "ACCEPTED"}
                      onClick={() => setConfirmStatusData({
                        id: journal.id,
                        teacherStatus: "PUBLISHED",
                        journalStatus: "PUBLISHED",
                      })}
                    >
                      <Check className="mr-2 h-4 w-4 text-blue-600" />
                      Publish Journal
                    </DropdownMenuItem>

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Change Journal Status</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {["SUBMITTED", "UNDER_REVIEW", "APPROVED", "PUBLISHED"].map(s => (
                          <DropdownMenuItem
                            key={s}
                            disabled={journal.journalStatus === s}
                            onClick={async () => {
                              const res = await updateAdminJournal(journal.id, { journalStatus: s })
                              if (res.data) {
                                toast.success(`Editorial status → ${formatLabel(s)}`)
                                void fetchJournals()
                                onRefresh?.()
                              } else {
                                toast.error(res.error || "Update failed")
                              }
                            }}
                          >
                            {formatLabel(s)}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <DropdownMenuItem onClick={() => handleTogglePublic(journal.id, journal.isPublic)}>
                      {journal.isPublic ? "Make Private" : "Make Public"}
                    </DropdownMenuItem>
                  </>
                )}

                {/* ── SUPERADMIN exclusive overrides ───────────────────────── */}
                {canForceSA && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[10px] text-violet-500 font-semibold py-0 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> SUPERADMIN Overrides
                    </DropdownMenuLabel>

                    {/* Force-publish: bypass the ACCEPTED requirement */}
                    <DropdownMenuItem
                      disabled={journal.teacherStatus === "PUBLISHED"}
                      className="text-violet-600 focus:text-violet-700 focus:bg-violet-50 dark:focus:bg-violet-900/20"
                      onClick={() => setForcePublishJournal(journal)}
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Force Publish
                    </DropdownMenuItem>

                    {/* Override comment — sets UPDATE status + message for authors */}
                    <DropdownMenuItem
                      className="text-violet-600 focus:text-violet-700 focus:bg-violet-50 dark:focus:bg-violet-900/20"
                      onClick={() => {
                        setOverrideCommentJournal(journal)
                        setOverrideComment(journal.updateComment ?? "")
                      }}
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Set Override Comment
                    </DropdownMenuItem>
                  </>
                )}

                {/* ── Delete (ADMIN+ only; published only for SUPERADMIN) ───── */}
                {canMutate && (
                  <>
                    <DropdownMenuSeparator />
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {/* Wrap in span so Tooltip works even when item is disabled */}
                          <span>
                            <DropdownMenuItem
                              disabled={
                                journal.teacherStatus === "PUBLISHED" && !canForceSA
                              }
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                              onClick={() => {
                                setDeleteJournalId(journal.id)
                                setDeleteIsPublished(journal.teacherStatus === "PUBLISHED")
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Journal
                            </DropdownMenuItem>
                          </span>
                        </TooltipTrigger>
                        {journal.teacherStatus === "PUBLISHED" && !canForceSA && (
                          <TooltipContent side="left" className="text-xs max-w-48">
                            Only SUPERADMIN can delete published journals.
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: journals,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
  })

  const selectedCount = Object.keys(rowSelection).filter(k => rowSelection[k]).length

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center justify-between flex-wrap gap-4">
          <span className="flex items-center gap-2">
            Journal Submissions Queue
            {/* Role badge */}
            {isEditorOnly && (
              <Badge variant="secondary" className="text-xs font-normal">
                Read-only (Editor)
              </Badge>
            )}
            {canForceSA && (
              <Badge className="text-xs bg-violet-600 text-white font-normal">
                SUPERADMIN
              </Badge>
            )}
            {!isEditorOnly && !canForceSA && canMutate && (
              <Badge variant="outline" className="text-xs font-normal">
                Admin
              </Badge>
            )}
          </span>

          {/* Bulk delete — ADMIN+ only */}
          {canMutate && selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-normal text-muted-foreground">
                {selectedCount} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                className="h-8"
                onClick={() => setIsBulkDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-1.5" /> Bulk Delete
              </Button>
            </div>
          )}
        </CardTitle>
        <CardDescription>
          {isEditorOnly
            ? "Review journal submissions and update status. Destructive operations require ADMIN access."
            : "Audit, review, verify, publish and delete journal submissions."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search + Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search title, DOI, serial no…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
            {search && (
              <Button
                variant="ghost" size="icon"
                onClick={() => setSearch("")}
                className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <AdminJournalFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(hg => (
                <TableRow key={hg.id}>
                  {hg.headers.map(header => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((_, j) => (
                      <TableCell key={j} className="py-4">
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : journals.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    No journals match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!isLoading && totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-muted-foreground">
              Showing <span className="font-semibold">{(page - 1) * limit + 1}</span>–
              <span className="font-semibold">{Math.min(page * limit, totalCount)}</span> of{" "}
              <span className="font-semibold">{totalCount}</span> journals
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">Rows per page</span>
                <Select
                  value={limit.toString()}
                  onValueChange={val => { setLimit(parseInt(val)); setPage(1) }}
                >
                  <SelectTrigger className="h-8 w-[70px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50].map(ps => (
                      <SelectItem key={ps} value={ps.toString()}>{ps}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline" size="icon" className="h-8 w-8"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-xs font-semibold px-2">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline" size="icon" className="h-8 w-8"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* ── Detail Sheet ─────────────────────────────────────────────────────── */}
      <AdminJournalDetail
        journal={activeJournal}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onUpdate={() => { void fetchJournals(); onRefresh?.() }}
      />

      {/* ── Status Confirmation ───────────────────────────────────────────────── */}
      <AlertDialog
        open={confirmStatusData !== null}
        onOpenChange={open => !open && setConfirmStatusData(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Review Decision</AlertDialogTitle>
            <AlertDialogDescription>
              Change teacher status to{" "}
              <span className="font-semibold text-foreground">
                {confirmStatusData ? formatLabel(confirmStatusData.teacherStatus) : ""}
              </span>
              ?
              {confirmStatusData?.teacherStatus === "ACCEPTED" && (
                <span className="block mt-2 text-xs text-muted-foreground">
                  This will also set journal status to Approved.
                </span>
              )}
              {confirmStatusData?.teacherStatus === "PUBLISHED" && (
                <span className="block mt-2 text-xs text-muted-foreground">
                  This will publish the journal and make it publicly visible.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={e => { e.preventDefault(); void handleStatusConfirm() }}
              disabled={isActionLoading}
            >
              {isActionLoading ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Updating</> : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Confirmation ───────────────────────────────────────────────── */}
      <AlertDialog
        open={deleteJournalId !== null}
        onOpenChange={open => !open && setDeleteJournalId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteIsPublished ? "Delete Published Journal?" : "Delete Journal?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteIsPublished
                ? "This journal is currently published and publicly visible. Deleting it will remove it from the public listing immediately. This action cannot be undone."
                : "This will permanently delete the journal submission and all author mappings. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={e => { e.preventDefault(); void handleDeleteConfirm() }}
              disabled={isActionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isActionLoading ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Deleting</> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Bulk Delete Confirmation ──────────────────────────────────────────── */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk Delete {selectedCount} Journal(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">{selectedCount}</span> selected
              journal(s) and their author mappings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={e => { e.preventDefault(); void handleBulkDelete() }}
              disabled={isActionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isActionLoading ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Deleting</> : "Delete Selected"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── SUPERADMIN: Force-Publish Dialog ─────────────────────────────────── */}
      <Dialog
        open={forcePublishJournal !== null}
        onOpenChange={open => { if (!open) { setForcePublishJournal(null); setForcePublishReason("") } }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-violet-600">
              <Zap className="h-5 w-5" /> SUPERADMIN Force Publish
            </DialogTitle>
            <DialogDescription>
              This bypasses the PI acceptance requirement and immediately publishes the journal.
              A mandatory override reason is recorded and visible to authors.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-md border border-violet-200 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-800 p-3 text-sm">
              <p className="font-medium line-clamp-2">{forcePublishJournal?.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{forcePublishJournal?.serialNo}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="force-reason">Override Reason <span className="text-destructive">*</span></Label>
              <Textarea
                id="force-reason"
                placeholder="State the justification for bypassing the normal workflow…"
                value={forcePublishReason}
                onChange={e => setForcePublishReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-[11px] text-muted-foreground">
                This reason will be prepended with [SUPERADMIN OVERRIDE] and stored as the update comment.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setForcePublishJournal(null); setForcePublishReason("") }}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              className="bg-violet-600 hover:bg-violet-700 text-white"
              disabled={!forcePublishReason.trim() || isActionLoading}
              onClick={() => void handleForcePublish()}
            >
              {isActionLoading
                ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Publishing</>
                : <><Zap className="h-4 w-4 mr-1.5" /> Force Publish</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── SUPERADMIN: Override Comment Dialog ──────────────────────────────── */}
      <Dialog
        open={overrideCommentJournal !== null}
        onOpenChange={open => { if (!open) { setOverrideCommentJournal(null); setOverrideComment("") } }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-violet-600">
              <Lock className="h-5 w-5" /> Set Override Comment
            </DialogTitle>
            <DialogDescription>
              Sets a correction message visible to the authors and moves the journal back to UPDATE / UNDER REVIEW status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-md border border-violet-200 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-800 p-3 text-sm">
              <p className="font-medium line-clamp-2">{overrideCommentJournal?.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{overrideCommentJournal?.serialNo}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="override-comment">Message to Authors <span className="text-destructive">*</span></Label>
              <Textarea
                id="override-comment"
                placeholder="Describe the corrections or clarifications required…"
                value={overrideComment}
                onChange={e => setOverrideComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setOverrideCommentJournal(null); setOverrideComment("") }}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              className="bg-violet-600 hover:bg-violet-700 text-white"
              disabled={!overrideComment.trim() || isActionLoading}
              onClick={() => void handleOverrideComment()}
            >
              {isActionLoading
                ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving</>
                : <><Lock className="h-4 w-4 mr-1.5" /> Save Comment</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
