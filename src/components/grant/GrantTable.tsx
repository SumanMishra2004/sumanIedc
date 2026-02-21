"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Globe,
  Lock,
  Users,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { GrantIn, GrantInFilters } from "@/types/grant-in"
import { GrantInRole, GrantInStatus, UserRole } from "@prisma/client"
import { GrantViewDialog } from "./ViewDialog"
import { GrantEditDialog } from "./GrantEditForm"
import { GrantExportDialog } from "./GrantExportDialog"
import { GrantFilterDialog } from "./GrantFilterDialog"

interface GrantTableProps {
  grants: GrantIn[]
  userRole: UserRole
  currentUserId: string
  onDelete?: (grant: GrantIn) => void
  onBulkDelete?: (ids: string[]) => Promise<void>
  onRefresh?: () => void
  filters: GrantInFilters
  onFiltersChange: (filters: Partial<GrantInFilters>) => void
  onClearFilters: () => void
  loading?: boolean
}

const STATUS_CONFIG: Record<
  GrantInStatus,
  { label: string; className: string }
> = {
  APPLIED:   { label: "Applied",   className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800" },
  GRANTED:   { label: "Granted",   className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800" },
  REJECTED:  { label: "Rejected",  className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800" },
  COMPLETED: { label: "Completed", className: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" },
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n)

export function GrantTable({
  grants,
  userRole,
  currentUserId,
  onDelete,
  onBulkDelete,
  onRefresh,
  filters,
  onFiltersChange,
  onClearFilters,
  loading = false,
}: GrantTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [bulkDeleting, setBulkDeleting] = React.useState(false)
  const [viewingGrantId, setViewingGrantId] = React.useState<string | null>(null)
  const [editingGrantId, setEditingGrantId] = React.useState<string | null>(null)

  const isCurrentUserPiOrCoPi = (grant: GrantIn) =>
    grant.facultyAuthors.some(
      (a) =>
        a.userId === currentUserId &&
        (a.role === GrantInRole.FACULTY_PI || a.role === GrantInRole.FACULTY_COPI)
    )

  const getMyRole = (grant: GrantIn): string | null => {
    const fa = grant.facultyAuthors.find((a) => a.userId === currentUserId)
    if (fa) return fa.role.replace("FACULTY_", "").replace("_", " ")
    const sa = grant.studentAuthors.find((a) => a.userId === currentUserId)
    if (sa) return "Student"
    return null
  }

  const canDeleteGrant = (grant: GrantIn) =>
    userRole === "ADMIN" || isCurrentUserPiOrCoPi(grant)

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k])
    if (selectedIds.length === 0) return
    if (!confirm(`Delete ${selectedIds.length} selected grant(s)? This cannot be undone.`)) return
    setBulkDeleting(true)
    try {
      await onBulkDelete?.(selectedIds)
      setRowSelection({})
    } finally {
      setBulkDeleting(false)
    }
  }

  const columns: ColumnDef<GrantIn>[] = [
    {
      id: "select",
      header: ({ table }) => {
        const selectableRows = table.getRowModel().rows.filter((r) =>
          canDeleteGrant(r.original)
        )
        const allSelected =
          selectableRows.length > 0 &&
          selectableRows.every((r) => r.getIsSelected())
        const someSelected = selectableRows.some((r) => r.getIsSelected())
        return (
          <Checkbox
            checked={allSelected}
            ref={(el) => { if (el) (el as any).indeterminate = !allSelected && someSelected }}
            onCheckedChange={(checked) => {
              selectableRows.forEach((r) => r.toggleSelected(!!checked))
            }}
            aria-label="Select all"
            className="translate-y-[2px]"
          />
        )
      },
      cell: ({ row }) => {
        if (!canDeleteGrant(row.original)) return null
        return (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={(e) => e.stopPropagation()}
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "projectCode",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="px-0 font-semibold text-xs h-auto hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Project Code
          <ArrowUpDown className="ml-1.5 h-3 w-3 text-muted-foreground" />
        </Button>
      ),
      cell: ({ row }) => {
        const grant = row.original
        const myRole = getMyRole(grant)
        return (
          <div className="min-w-32 space-y-0.5">
            <p className="font-semibold text-sm text-foreground">
              {grant.projectCode || "—"}
            </p>
            {myRole && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 font-medium border-primary/30 text-primary bg-primary/5"
              >
                {myRole}
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "grantInStatus",
      header: () => <span className="text-xs font-semibold">Status</span>,
      cell: ({ row }) => {
        const status = row.getValue("grantInStatus") as GrantInStatus
        const cfg = STATUS_CONFIG[status] ?? { label: status, className: "bg-muted text-muted-foreground" }
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.className}`}
          >
            {cfg.label}
          </span>
        )
      },
    },
    {
      id: "visibility",
      header: () => <span className="text-xs font-semibold">Visibility</span>,
      cell: ({ row }) => {
        const grant = row.original
        return grant.isPublic ? (
          <span className="inline-flex items-center gap-1 text-xs text-sky-600 font-medium">
            <Globe className="h-3 w-3" /> Public
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" /> Private
          </span>
        )
      },
    },
    {
      id: "pi",
      header: () => <span className="text-xs font-semibold">PI / Co-PI</span>,
      cell: ({ row }) => {
        const grant = row.original
        const piList = grant.facultyAuthors.filter(
          (a) => a.role === GrantInRole.FACULTY_PI || a.role === GrantInRole.FACULTY_COPI
        )
        if (piList.length === 0)
          return <span className="text-muted-foreground text-xs">—</span>
        return (
          <TooltipProvider delayDuration={100}>
            <div className="flex -space-x-2">
              {piList.slice(0, 3).map((a) => (
                <Tooltip key={a.id}>
                  <TooltipTrigger asChild>
                    <Avatar className="h-7 w-7 border-2 border-background cursor-default ring-1 ring-muted shadow-sm">
                      <AvatarImage src={a.user?.image || undefined} />
                      <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                        {a.user?.name?.charAt(0) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-medium">{a.user?.name ?? "Unknown"}</p>
                    <p className="text-muted-foreground capitalize">
                      {a.role.replace("FACULTY_", "").toLowerCase().replace("_", "-")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {piList.length > 3 && (
                <Avatar className="h-7 w-7 border-2 border-background ring-1 ring-muted">
                  <AvatarFallback className="text-[10px] bg-muted font-semibold">
                    +{piList.length - 3}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </TooltipProvider>
        )
      },
    },
    {
      id: "team",
      header: () => <span className="text-xs font-semibold">Team</span>,
      cell: ({ row }) => {
        const grant = row.original
        const total = grant.facultyAuthors.length + grant.studentAuthors.length
        return (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{total}</span>
          </span>
        )
      },
    },
    {
      accessorKey: "amountGranted",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="px-0 font-semibold text-xs h-auto hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Granted
          <ArrowUpDown className="ml-1.5 h-3 w-3 text-muted-foreground" />
        </Button>
      ),
      cell: ({ row }) => {
        const v = row.getValue("amountGranted") as number | null
        return v != null ? (
          <span className="font-semibold text-emerald-600 text-sm tabular-nums">
            {fmt(v)}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )
      },
    },
    {
      accessorKey: "usedAmount",
      header: () => <span className="text-xs font-semibold">Utilised</span>,
      cell: ({ row }) => {
        const grant = row.original
        const used = grant.usedAmount
        const total = grant.amountGranted
        if (used == null) return <span className="text-muted-foreground text-sm">—</span>
        const pct = total && total > 0 ? Math.round((used / total) * 100) : null
        const pctColor =
          pct == null ? "" : pct >= 90 ? "text-red-500" : pct >= 60 ? "text-amber-500" : "text-muted-foreground"
        return (
          <div className="min-w-[90px] space-y-1">
            <span className="text-sm font-semibold text-orange-600 tabular-nums">{fmt(used)}</span>
            {pct != null && (
              <div className="flex items-center gap-1.5">
                <div className="h-1 w-12 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct >= 90 ? "bg-red-500" : pct >= 60 ? "bg-amber-400" : "bg-emerald-400"
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <span className={`text-[10px] font-medium tabular-nums ${pctColor}`}>{pct}%</span>
              </div>
            )}
          </div>
        )
      },
    },
    {
      id: "bills",
      header: () => <span className="text-xs font-semibold">Bills</span>,
      cell: ({ row }) => {
        const grant = row.original
        const count = (grant.bills ?? []).filter((b) => !b.isMasterPdf).length
        return (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Receipt className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{count}</span>
          </span>
        )
      },
    },
    {
      accessorKey: "applicationDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="px-0 font-semibold text-xs h-auto hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Applied
          <ArrowUpDown className="ml-1.5 h-3 w-3 text-muted-foreground" />
        </Button>
      ),
      cell: ({ row }) => {
        const d = row.getValue("applicationDate") as string | null
        return (
          <span className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
            {d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
          </span>
        )
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const grant = row.original
        const canEdit = userRole === "ADMIN" || isCurrentUserPiOrCoPi(grant)
        const canDel = userRole === "ADMIN" || isCurrentUserPiOrCoPi(grant)
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 opacity-0 group-hover/row:opacity-100 transition-opacity"
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">Actions</DropdownMenuLabel>
              <DropdownMenuItem
                className="text-sm cursor-pointer"
                onClick={() => setViewingGrantId(grant.id)}
              >
                <Eye className="mr-2 h-3.5 w-3.5" /> View Details
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem
                  className="text-sm cursor-pointer"
                  onClick={() => setEditingGrantId(grant.id)}
                >
                  <Edit className="mr-2 h-3.5 w-3.5" /> Edit Grant
                </DropdownMenuItem>
              )}
              {canDel && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-sm text-destructive focus:text-destructive cursor-pointer"
                    onClick={() => onDelete?.(grant)}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Grant
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: grants,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: (row) => canDeleteGrant(row.original),
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    initialState: { pagination: { pageSize: 10 } },
    state: { sorting, columnFilters, rowSelection },
  })

  const pageCount = table.getPageCount()
  const pageIndex = table.getState().pagination.pageIndex
  const totalRows = table.getFilteredRowModel().rows.length
  const selectedCount = Object.values(rowSelection).filter(Boolean).length

  return (
    <div className="relative w-full rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px] rounded-xl">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border/60 bg-muted/20">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{totalRows}</p>
          <p className="text-sm text-muted-foreground">
            grant{totalRows !== 1 ? "s" : ""}
          </p>
          {selectedCount > 0 && (
            <span className="text-xs text-muted-foreground ml-1">
              · {selectedCount} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && onBulkDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="h-8"
            >
              {bulkDeleting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              Delete {selectedCount}
            </Button>
          )}
          <GrantFilterDialog
            filters={filters}
            onFiltersChange={onFiltersChange}
            onClearRun={onClearFilters}
          />
          <GrantExportDialog />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/30 hover:bg-muted/30 border-border/60">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs py-2.5 first:pl-4 last:pr-4">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="group/row cursor-pointer hover:bg-muted/30 transition-colors border-border/40"
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => setViewingGrantId(row.original.id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-3 first:pl-4 last:pr-4"
                      onClick={
                        cell.column.id === "actions"
                          ? (e) => e.stopPropagation()
                          : undefined
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-40 text-center"
                >
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Receipt className="h-8 w-8 opacity-30" />
                    <p className="text-sm font-medium">No grants found</p>
                    <p className="text-xs">Try adjusting your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ── */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 bg-muted/10">
          <p className="text-xs text-muted-foreground">
            Page <span className="font-medium text-foreground">{pageIndex + 1}</span> of{" "}
            <span className="font-medium text-foreground">{pageCount}</span>
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <GrantViewDialog
        grantId={viewingGrantId}
        open={!!viewingGrantId}
        setOpen={(open) => !open && setViewingGrantId(null)}
        userRole={userRole}
        currentUserId={currentUserId}
        onDelete={(grant) => {
          setViewingGrantId(null)
          onDelete?.(grant)
        }}
      />

      <GrantEditDialog
        grantId={editingGrantId}
        open={!!editingGrantId}
        onOpenChange={(open) => !open && setEditingGrantId(null)}
        onSuccess={() => onRefresh?.()}
        userRole={userRole}
        currentUserId={currentUserId}
      />
    </div>
  )
}