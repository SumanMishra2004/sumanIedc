
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
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash,
  FileDown,
  Plus,
  LayoutGrid,
  List,
  Search,
  BookOpen,
  Calendar,
  Building,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { FilterDialog } from "./certificateFilterDialog";
import { ExportDialog } from "./certificateExportDialog";
import { Certificate, CertificateFilters } from "@/types/certificate";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CertificateAddForm from "./certificateAddForm";
import CertificateEditForm from "./certificateEditForm";
import { CertificateViewDialog } from "./viewDialog";
import { toast } from "sonner";
import {
  getCertificates,
  deleteCertificate,
} from "@/lib/research/certificateApi";

export default function CertificateTable() {
  const [data, setData] = React.useState<Certificate[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  
  // Pagination & Sorting state
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Backend filters
  const [filters, setFilters] = React.useState<CertificateFilters>({});

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [selectedCertificate, setSelectedCertificate] = React.useState<Certificate | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await getCertificates({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        ...filters
      });
      
      if (response.data) {
        setData(response.data.certificates);
        setTotal(response.data.pagination.total);
      } else {
        toast.error(response.error || "Failed to fetch certificates");
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
      const response = await deleteCertificate(id);
      if (response.data) {
        toast.success("Certificate deleted successfully");
        fetchData();
      } else {
        toast.error(response.error || "Failed to delete");
      }
    } catch (error) {
      toast.error("Error deleting certificate");
    }
  };

  const columns: ColumnDef<Certificate>[] = [
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
      accessorKey: "offeredBy",
      header: "Offered By",
      cell: ({ row }) => <div className="truncate max-w-[150px]">{row.getValue("offeredBy") || "N/A"}</div>,
    },
    {
      accessorKey: "dateOfCompletion",
      header: "Completion Date",
      cell: ({ row }) => {
        const date = row.getValue("dateOfCompletion");
        return date ? new Date(date as string).toLocaleDateString() : "N/A";
      },
    },
    {
      accessorKey: "user.name", // Access nested
      header: "User",
       cell: ({ row }) => <div className="truncate">{row.original.user.name}</div>,
    },
    {
      accessorKey: "isPublic",
      header: "Visibility",
      cell: ({ row }) => {
        const isPublic = row.getValue("isPublic") as boolean;
        return (
          <Badge variant={isPublic ? "outline" : "secondary"}>
            {isPublic ? "Public" : "Private"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const certificate = row.original;

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
                  setSelectedCertificate(certificate);
                  setViewDialogOpen(true);
                }}
              >
                <Eye className="mr-2 h-4 w-4" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedCertificate(certificate);
                  setEditDialogOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handleDelete(certificate.id)}
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
    onPaginationChange: setPagination, // Handle manual pagination
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        {/* Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search certificates..."
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
           <CertificateAddForm onSuccess={fetchData} trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Certificate
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

      <CertificateViewDialog 
         certificate={selectedCertificate}
         open={viewDialogOpen}
         onOpenChange={setViewDialogOpen}
      />
      
      <CertificateEditForm
        certificateId={selectedCertificate?.id || null}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchData}
      />
    </div>
  );
}
