"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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

import { GrantIn, GrantInFilters } from "@/types/grant-in"
import { GrantInStatus, UserRole } from "@prisma/client"
import { GrantViewDialog } from "./ViewDialog"
import { GrantEditDialog } from "./GrantEditForm"
import { GrantExportDialog } from "./GrantExportDialog"
import { GrantFilterDialog } from "./GrantFilterDialog"

interface GrantTableProps {
  grants: GrantIn[]
  userRole: UserRole
  currentUserId: string
  onView?: (grant: GrantIn) => void
  onEdit?: (grant: GrantIn) => void
  onDelete?: (grant: GrantIn) => void
}

export function GrantTable({ 
  grants, 
  userRole, 
  onDelete 
}: GrantTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [viewingGrantId, setViewingGrantId] = React.useState<string | null>(null)
  const [editingGrantId, setEditingGrantId] = React.useState<string | null>(null)
  const [filters, setFilters] = React.useState<GrantInFilters>({})

  const handleFiltersChange = (newFilters: Partial<GrantInFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleClearFilters = () => {
    setFilters({})
  }

  // Columns definition
  const columns: ColumnDef<GrantIn>[] = [
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
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "projectCode",
      header: "Project Code",
      cell: ({ row }) => <div className="font-medium">{row.getValue("projectCode") || "N/A"}</div>,
    },
    {
      accessorKey: "grantInStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("grantInStatus") as string
        return (
          <Badge variant={status === GrantInStatus.GRANTED ? "default" : "secondary"}>
            {status.replace(/_/g, ' ')}
          </Badge>
        )
      },
    },
    {
      accessorKey: "amountGranted",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Amount Granted
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const amount = row.getValue("amountGranted") 
        if (!amount) return <div className="text-right text-muted-foreground">-</div>
        
        try {
          const formatted = new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
          }).format(parseFloat(amount as string))
          return <div className="font-medium text-right text-emerald-600">{formatted}</div>
        } catch {
          return <div className="text-right">{amount as string}</div>
        }
      },
    },
    {
      accessorKey: "applicationDate",
      header: "Application Date",
      cell: ({ row }) => {
        const date = row.getValue("applicationDate") as string
        return <div>{date ? new Date(date).toLocaleDateString() : "N/A"}</div>
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const grant = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setViewingGrantId(grant.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {(userRole === "ADMIN" || userRole === "FACULTY") && (
                <DropdownMenuItem onClick={() => setEditingGrantId(grant.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Grant
                </DropdownMenuItem>
              )}
              {userRole === "ADMIN" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete?.(grant)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Grant
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
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Filter by Status..."
          value={(table.getColumn("grantInStatus")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("grantInStatus")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        
        <GrantFilterDialog
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearRun={handleClearFilters}
        />
        <GrantExportDialog />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
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
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      <GrantViewDialog 
        grantId={viewingGrantId} 
        open={!!viewingGrantId} 
        setOpen={(open) => !open && setViewingGrantId(null)} 
      />
      
      <GrantEditDialog 
        grantId={editingGrantId} 
        open={!!editingGrantId} 
        onOpenChange={(open) => !open && setEditingGrantId(null)}
        onSuccess={() => window.location.reload()} // For simple refresh
      />
    </div>
  )
}
