
"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash,
  Plus,
  Search,
  Calendar,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { FilterDialog } from "./fdpFilterDialog";
import { ExportDialog } from "./fdpExportDialog";
import { FDP, FDPFilters } from "@/types/fdp";
import FDPAddForm from "./fdpAddForm";
import FDPEditForm from "./fdpEditForm";
import { FDPViewDialog } from "./viewDialog";
import { toast } from "sonner";
import {
  getFDPs,
  deleteFDP,
} from "@/lib/research/fdpApi";

export default function FDPTable() {
  const [data, setData] = React.useState<FDP[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [filters, setFilters] = React.useState<FDPFilters>({});

  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [selectedFDP, setSelectedFDP] = React.useState<FDP | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await getFDPs({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        ...filters
      });
      
      if (response.data) {
        setData(response.data.fdps);
        setTotal(response.data.pagination.total);
      } else {
        toast.error(response.error || "Failed to fetch FDP records");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, filters]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    try {
      const response = await deleteFDP(id);
      if (response.data) {
        toast.success("FDP record deleted successfully");
        fetchData();
      } else {
        toast.error(response.error || "Failed to delete");
      }
    } catch (error) {
      toast.error("Error deleting FDP record");
    }
  };

  const columns: ColumnDef<FDP>[] = [
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
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <div className="font-medium truncate max-w-[200px]" title={row.getValue("title")}>{row.getValue("title")}</div>,
    },
    {
      accessorKey: "organizedBy",
      header: "Organized By",
      cell: ({ row }) => <div className="truncate max-w-[150px]">{row.getValue("organizedBy") || "N/A"}</div>,
    },
    {
        accessorKey: "topic",
        header: "Topic",
        cell: ({ row }) => <div className="truncate max-w-[150px]">{row.getValue("topic") || "N/A"}</div>,
    },
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) => {
        const date = row.getValue("startDate");
        return date ? new Date(date as string).toLocaleDateString() : "N/A";
      },
    },
    {
      accessorKey: "duration",
      header: "Duration",
      cell: ({ row }) => <div>{row.getValue("duration") || "N/A"}</div>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const fdp = row.original;

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
              <DropdownMenuItem
                onClick={() => {
                  setSelectedFDP(fdp);
                  setViewDialogOpen(true);
                }}
              >
                <Eye className="mr-2 h-4 w-4" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedFDP(fdp);
                  setEditDialogOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handleDelete(fdp.id)}
              >
                <Trash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
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
      pagination,
    },
    manualPagination: true,
    pageCount: Math.ceil(total / pagination.pageSize),
    onPaginationChange: setPagination,
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        {/* Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search FDP records..."
                  value={filters.search || ""}
                  onChange={(event) =>
                    setFilters({ ...filters, search: event.target.value })
                  }
                  className="pl-8"
                />
            </div>
           
             <FilterDialog 
                filters={filters} 
                onFiltersChange={(newFilters) => setFilters(prev => ({...prev, ...newFilters}))}
                onClearFilters={() => setFilters({})}
             />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
           <ExportDialog />
           <FDPAddForm onSuccess={fetchData} trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add FDP
              </Button>
           } />
        </div>
      </div>
      
      <div className="rounded-md border bg-card">
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
                  );
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
                  {loading ? "Loading..." : "No results."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
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

      <FDPViewDialog 
         fdp={selectedFDP}
         open={viewDialogOpen}
         onOpenChange={setViewDialogOpen}
      />
      
      <FDPEditForm
        fdpId={selectedFDP?.id || null}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchData}
      />
    </div>
  );
}
