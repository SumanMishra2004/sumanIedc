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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import AdminJournalFilters, { JournalFilterValues } from "./AdminJournalFilters"
import AdminJournalDetail from "./AdminJournalDetail"
import {
  getAdminJournals,
  updateAdminJournal,
  deleteAdminJournal,
  bulkDeleteAdminJournals,
} from "@/lib/admin/adminJournalApi"
import { Journal, JournalFilters } from "@/types/journal"

interface AdminJournalTableProps {
  onRefresh?: () => void
}

const teacherStatusColors: Record<string, string> = {
  UPLOADED: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  UPDATE: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  REJECTED: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  PUBLISHED: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
}

const journalStatusColors: Record<string, string> = {
  SUBMITTED: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  PUBLISHED: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
}

export default function AdminJournalTable({ onRefresh }: AdminJournalTableProps) {
  // Query states
  const [filters, setFilters] = React.useState<JournalFilterValues>({})
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)
  const [sortBy, setSortBy] = React.useState("createdAt")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")

  // Data states
  const [journals, setJournals] = React.useState<Journal[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [totalPages, setTotalPages] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(true)
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({})

  // Modal / Detail states
  const [activeJournal, setActiveJournal] = React.useState<Journal | null>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [deleteJournalId, setDeleteJournalId] = React.useState<string | null>(null)
  const [confirmStatusData, setConfirmStatusData] = React.useState<{
    id: string
    teacherStatus: string
    journalStatus?: string
  } | null>(null)
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false)
  const [isActionLoading, setIsActionLoading] = React.useState(false)

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const fetchJournals = React.useCallback(async () => {
    setIsLoading(true)
    const res = await getAdminJournals({
      page,
      limit,
      sortBy,
      sortOrder,
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

  React.useEffect(() => {
    void fetchJournals()
  }, [fetchJournals])

  const handleFilterChange = (key: keyof JournalFilterValues, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleClearFilters = () => {
    setFilters({})
    setSearch("")
    setPage(1)
  }

  const handleStatusChangeAction = async () => {
    if (!confirmStatusData) return
    setIsActionLoading(true)
    const { id, teacherStatus, journalStatus } = confirmStatusData
    const res = await updateAdminJournal(id, { teacherStatus, journalStatus })
    setIsActionLoading(false)
    setConfirmStatusData(null)

    if (res.data) {
      toast.success(`Journal status updated successfully`)
      void fetchJournals()
      if (onRefresh) onRefresh()
    } else {
      toast.error(res.error || "Failed to update journal status")
    }
  }

  const handleDeleteAction = async () => {
    if (!deleteJournalId) return
    setIsActionLoading(true)
    const res = await deleteAdminJournal(deleteJournalId)
    setIsActionLoading(false)
    setDeleteJournalId(null)

    if (res.data) {
      toast.success("Journal deleted successfully")
      void fetchJournals()
      if (onRefresh) onRefresh()
    } else {
      toast.error(res.error || "Failed to delete journal")
    }
  }

  const handleBulkDeleteAction = async () => {
    const selectedIds = Object.keys(rowSelection).filter((key) => rowSelection[key])
    if (selectedIds.length === 0) return

    setIsActionLoading(true)
    const res = await bulkDeleteAdminJournals(selectedIds)
    setIsActionLoading(false)
    setIsBulkDeleteOpen(false)

    if (res.data) {
      toast.success(`Successfully deleted ${res.data.count} journal(s)`)
      setRowSelection({})
      void fetchJournals()
      if (onRefresh) onRefresh()
    } else {
      toast.error(res.error || "Failed to bulk delete journals")
    }
  }

  const handleTogglePublic = async (id: string, currentPublic: boolean) => {
    const res = await updateAdminJournal(id, { isPublic: !currentPublic })
    if (res.data) {
      toast.success(`Journal visibility updated to ${!currentPublic ? 'Public' : 'Private'}`)
      void fetchJournals()
      if (onRefresh) onRefresh()
    } else {
      toast.error(res.error || "Failed to toggle journal visibility")
    }
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
    setPage(1)
  }

  function formatLabel(value: string): string {
    return value
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  // TanStack columns
  const columns: ColumnDef<Journal>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "title",
      header: () => (
        <Button variant="ghost" className="p-0 hover:bg-transparent" onClick={() => handleSort("title")}>
          Title
          <ArrowUpDown className="ml-2 h-4 w-4 shrink-0" />
        </Button>
      ),
      cell: ({ row }) => {
        const title = row.getValue("title") as string
        const serialNo = row.original.serialNo
        return (
          <div className="max-w-[300px] sm:max-w-[400px]">
            <div className="font-semibold text-sm leading-normal line-clamp-2" title={title}>
              {title}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 font-mono">
              {serialNo}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "journalName",
      header: () => (
        <Button variant="ghost" className="p-0 hover:bg-transparent" onClick={() => handleSort("journalName")}>
          Journal Name
          <ArrowUpDown className="ml-2 h-4 w-4 shrink-0" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate font-medium text-xs sm:text-sm">
          {row.getValue("journalName")}
        </div>
      ),
    },
    {
      id: "submittedBy",
      header: "Submitted By",
      cell: ({ row }) => {
        const facultyAuthor = row.original.facultyAuthors?.[0]?.user
        const studentAuthor = row.original.studentAuthors?.[0]?.user
        const author = facultyAuthor || studentAuthor
        
        if (!author) {
          return <span className="text-muted-foreground italic text-xs">Unknown</span>
        }
        
        return (
          <div>
            <div className="font-medium text-xs sm:text-sm truncate max-w-[150px]">
              {author.name || "Unnamed"}
            </div>
            <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">
              {facultyAuthor ? "Faculty" : "Student"} • {author.department || "N/A"}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "publicationDate",
      header: () => (
        <Button variant="ghost" className="p-0 hover:bg-transparent" onClick={() => handleSort("publicationDate")}>
          Date
          <ArrowUpDown className="ml-2 h-4 w-4 shrink-0" />
        </Button>
      ),
      cell: ({ row }) => {
        const dateVal = row.getValue("publicationDate") as string | null
        const displayDate = dateVal || row.original.createdAt
        return (
          <div className="text-xs font-medium">
            {new Date(displayDate).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        )
      },
    },
    {
      accessorKey: "teacherStatus",
      header: "Teacher Status",
      cell: ({ row }) => {
        const status = row.getValue("teacherStatus") as string
        return (
          <Badge variant="outline" className={`${teacherStatusColors[status]} capitalize text-[11px] font-medium`}>
            {formatLabel(status)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "journalStatus",
      header: "Journal Status",
      cell: ({ row }) => {
        const status = row.getValue("journalStatus") as string
        return (
          <Badge variant="outline" className={`${journalStatusColors[status]} capitalize text-[11px] font-medium`}>
            {formatLabel(status)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "indexing",
      header: "Indexing",
      cell: ({ row }) => {
        const indexing = row.getValue("indexing") as string
        return (
          <Badge variant="secondary" className="text-[10px] font-semibold">
            {indexing}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
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
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                
                <DropdownMenuItem
                  onClick={() => {
                    setActiveJournal(journal)
                    setIsDetailOpen(true)
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details & Edit
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  disabled={journal.teacherStatus === "ACCEPTED"}
                  onClick={() =>
                    setConfirmStatusData({
                      id: journal.id,
                      teacherStatus: "ACCEPTED",
                      journalStatus: "APPROVED",
                    })
                  }
                >
                  <Check className="mr-2 h-4 w-4 text-emerald-600" />
                  Accept Submission
                </DropdownMenuItem>

                <DropdownMenuItem
                  disabled={journal.teacherStatus === "UPDATE"}
                  onClick={() =>
                    setConfirmStatusData({
                      id: journal.id,
                      teacherStatus: "UPDATE",
                      journalStatus: "UNDER_REVIEW",
                    })
                  }
                >
                  <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                  Request Updates
                </DropdownMenuItem>

                <DropdownMenuItem
                  disabled={journal.teacherStatus === "REJECTED"}
                  className="text-red-600"
                  onClick={() =>
                    setConfirmStatusData({
                      id: journal.id,
                      teacherStatus: "REJECTED",
                    })
                  }
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject Submission
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Change Journal Status</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {["SUBMITTED", "UNDER_REVIEW", "APPROVED", "PUBLISHED"].map((s) => (
                      <DropdownMenuItem
                        key={s}
                        disabled={journal.journalStatus === s}
                        onClick={async () => {
                          const res = await updateAdminJournal(journal.id, { journalStatus: s })
                          if (res.data) {
                            toast.success(`Journal status updated to ${formatLabel(s)}`)
                            void fetchJournals()
                            if (onRefresh) onRefresh()
                          } else {
                            toast.error(res.error || "Failed to update journal status")
                          }
                        }}
                      >
                        {formatLabel(s)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem onClick={() => handleTogglePublic(journal.id, journal.isPublic)}>
                  Toggle Public ({journal.isPublic ? "Make Private" : "Make Public"})
                </DropdownMenuItem>

                {journal.documentUrl && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a href={journal.documentUrl} target="_blank" rel="noreferrer" className="flex items-center w-full">
                        <FileText className="mr-2 h-4 w-4" />
                        Open PDF Paper <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
                      </a>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onClick={() => setDeleteJournalId(journal.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
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
    state: {
      rowSelection,
    },
  })

  const selectedCount = Object.keys(rowSelection).filter((k) => rowSelection[k]).length

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center justify-between flex-wrap gap-4">
          <span>Journal Submissions Queue</span>
          {selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-normal text-muted-foreground">
                {selectedCount} item(s) selected
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
          Review and audit all student and faculty journal submissions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search journals (Title, DOI, Serial No)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
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

        {/* Data Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
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
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    No journals matching the criteria were found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination controls */}
        {!isLoading && totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-muted-foreground">
              Showing <span className="font-semibold">{(page - 1) * limit + 1}</span> to{" "}
              <span className="font-semibold">
                {Math.min(page * limit, totalCount)}
              </span>{" "}
              of <span className="font-semibold">{totalCount}</span> journals
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">Rows per page</span>
                <Select
                  value={limit.toString()}
                  onValueChange={(val) => {
                    setLimit(parseInt(val))
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={pageSize.toString()}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-xs font-semibold px-2">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Slide-out detail sheet */}
      <AdminJournalDetail
        journal={activeJournal}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onUpdate={() => {
          void fetchJournals()
          if (onRefresh) onRefresh()
        }}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={deleteJournalId !== null}
        onOpenChange={(open) => !open && setDeleteJournalId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this journal submission and all its linked author mappings from the database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleDeleteAction()
              }}
              disabled={isActionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Deleting
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Decision Confirmation Dialog */}
      <AlertDialog
        open={confirmStatusData !== null}
        onOpenChange={(open) => !open && setConfirmStatusData(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Review Decision</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the teacher status to{" "}
              <span className="font-semibold text-foreground">
                {confirmStatusData ? formatLabel(confirmStatusData.teacherStatus) : ""}
              </span>
              ?
              {confirmStatusData?.teacherStatus === "ACCEPTED" && (
                <span className="block mt-2 text-xs text-muted-foreground">
                  Note: This will also automatically approve the journal status.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleStatusChangeAction()
              }}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Updating
                </>
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the <span className="font-semibold text-foreground">{selectedCount}</span> selected journal submission(s) and their linked author mappings from the database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleBulkDeleteAction()
              }}
              disabled={isActionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Deleting
                </>
              ) : (
                "Delete Selected"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
