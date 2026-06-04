"use client";

import * as React from "react";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
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
  LayoutGrid,
  List,
  Search,
  GraduationCap,
  Calendar,
  Building,
  Plus,
  Loader2,
  Lock,
  Globe
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FilterDialog } from "./fdpFilterDialog";
import { ExportDialog } from "./fdpExportDialog";
import { FDP, FDPFilters } from "@/types/fdp";
import FDPAddForm from "./fdpAddForm";
import FDPEditForm from "./fdpEditForm";
import { FDPViewDialog } from "./viewDialog";
import { FDPStatus } from "@prisma/client";
import { toast } from "sonner";
import {
  getFDPs,
  deleteFDP,
  bulkDeleteFDPs,
  updateFDP,
} from "@/lib/research/fdpApi";
import { cn } from "@/lib/utils";

// Status configuration
const getStatusConfig = (status: FDPStatus) => {
  const configs = {
    APPROVED: {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-800",
      dot: "bg-emerald-500",
    },
    SUBMITTED: {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800",
      dot: "bg-blue-500",
    },
    UNDER_REVIEW: {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-800",
      dot: "bg-amber-500",
    },
  };
  return configs[status] || configs.SUBMITTED;
};

// Row Action Dropdown Component
interface FDPActionProps {
  fdp: FDP;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  session?: any;
}

const FDPActions = ({
  fdp,
  onDelete,
  onEdit,
  onView,
  session,
}: FDPActionProps) => {
  const isAdmin = session?.user?.role === "ADMIN";
  const isOwner = session?.user?.id === fdp.userId;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onView(fdp.id)}>
          <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
          View Details
        </DropdownMenuItem>
        {(isOwner || isAdmin) && (
          <DropdownMenuItem onClick={() => onEdit(fdp.id)}>
            <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
            Edit details
          </DropdownMenuItem>
        )}
        {(isOwner || isAdmin) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(fdp.id)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Column Definitions
const createColumns = ({
  onDelete,
  onEdit,
  onView,
  session,
}: {
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  session?: any;
}): ColumnDef<FDP>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value: boolean) =>
          table.toggleAllPageRowsSelected(!!value)
        }
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Title
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-semibold truncate max-w-60 text-foreground">
          {row.getValue("title")}
        </span>
        <span className="text-xs text-muted-foreground truncate max-w-60 mt-0.5">
          {row.original.description || "No description provided"}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "organizedBy",
    header: "Organized By",
    cell: ({ row }) => <span className="text-sm font-medium">{row.original.organizedBy || "—"}</span>,
  },
  {
    accessorKey: "topic",
    header: "Topic / Subject",
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.topic || "—"}</span>,
  },
  {
    accessorKey: "fdpStatus",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("fdpStatus") as FDPStatus;
      const config = getStatusConfig(status);
      return (
        <Badge
          variant="outline"
          className={cn("font-medium px-2.5 py-1", config.bg, config.text, config.border)}
        >
          <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", config.dot)} />
          {status.replace(/_/g, " ")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "startDate",
    header: "Dates",
    cell: ({ row }) => {
      const start = row.original.startDate;
      const end = row.original.endDate;
      return (
        <div className="flex flex-col text-[11px] text-muted-foreground">
          <span>S: {start ? new Date(start).toLocaleDateString() : "—"}</span>
          <span>E: {end ? new Date(end).toLocaleDateString() : "—"}</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <FDPActions
        fdp={row.original}
        onDelete={onDelete}
        onEdit={onEdit}
        onView={onView}
        session={session}
      />
    ),
  },
];

export default function FDPTable({ onRefresh }: { onRefresh?: () => void }) {
  const { data: session } = useSession();
  const [data, setData] = useState<FDP[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [searchTerm, setSearchTerm] = useState("");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFDP, setSelectedFDP] = useState<FDP | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const [filters, setFilters] = useState<FDPFilters>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getFDPs(filters);
      if (response.data) {
        setData(response.data.fdps);
        setTotalRecords(response.data.pagination.total);
      } else if (response.error) {
        toast.error("Failed to load FDP records", {
          description: response.error,
        });
      }
    } catch (error) {
      console.error("Error fetching FDPs:", error);
      toast.error("Failed to load FDP records");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        setFilters(prev => ({ ...prev, search: searchTerm.trim(), page: 1 }));
      } else {
        setFilters(prev => {
          const { search, ...rest } = prev;
          return rest;
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const updateFilters = (newFilters: Partial<FDPFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: filters.limit || 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setSearchTerm("");
  };

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this FDP record?")) return;
    try {
      const response = await deleteFDP(id);
      if (response.data) {
        toast.success("FDP record deleted successfully");
        fetchData();
        onRefresh?.();
      } else if (response.error) {
        toast.error("Failed to delete FDP record", {
          description: response.error,
        });
      }
    } catch (error) {
      toast.error("Failed to delete FDP record");
    }
  }, [fetchData, onRefresh]);

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection);
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} FDP record(s)?`)) return;
    try {
      const response = await bulkDeleteFDPs(selectedIds);
      if (response.data) {
        toast.success(`${response.data.count} FDP records deleted successfully`);
        setRowSelection({});
        fetchData();
        onRefresh?.();
      } else if (response.error) {
        toast.error("Failed to delete FDP records", {
          description: response.error,
        });
      }
    } catch {
      toast.error("An error occurred during bulk delete");
    }
  };

  const columns = useMemo(
    () =>
      createColumns({
        onDelete: handleDelete,
        onEdit: (id) => {
          const item = data.find(f => f.id === id);
          if (item) setSelectedFDP(item);
          setEditDialogOpen(true);
        },
        onView: (id) => {
          const item = data.find(f => f.id === id);
          if (item) setSelectedFDP(item);
          setViewDialogOpen(true);
        },
        session
      }),
    [handleDelete, session, data]
  );

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
    getRowId: (row) => row.id,
    manualPagination: true,
    pageCount: Math.ceil(totalRecords / (filters.limit || 10)),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: (filters.page || 1) - 1,
        pageSize: filters.limit || 10,
      },
    },
  });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.fdpStatus) count++;
    if (filters.isPublic !== undefined) count++;
    if (filters.startDateFrom || filters.startDateTo) count++;
    if (filters.organizedBy) count++;
    return count;
  }, [filters]);

  return (
    <>
      <div className="w-full space-y-4">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">FDPs</h2>
              <p className="text-sm text-muted-foreground">
                Manage your Faculty Development Programs, seminars, and workshops
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {Object.keys(rowSelection).length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="h-10 px-4 rounded-lg font-medium"
              >
                <Trash className="w-4 h-4 mr-2" />
                Delete selected ({Object.keys(rowSelection).length})
              </Button>
            )}

            <ExportDialog
              triggerButton={
                <Button variant="outline" size="sm" className="h-10 px-4 rounded-lg font-medium">
                  <FileDown className="w-4 h-4 mr-2 text-muted-foreground" />
                  Export
                </Button>
              }
            />

            <FDPAddForm
              onSuccess={fetchData}
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl bg-card border shadow-xs">
          <div className="flex flex-1 items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search FDP title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 bg-muted/20 hover:bg-muted/30 focus:bg-background transition-colors rounded-lg border-border"
              />
            </div>

            <FilterDialog
              filters={filters}
              onFiltersChange={updateFilters}
              onClearFilters={clearFilters}
              triggerButton={
                <Button variant="outline" size="sm" className="h-10 border-dashed relative">
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="border rounded-lg p-1 flex items-center bg-muted/30">
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode("table")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "card" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode("card")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>

            <Select
              value={String(filters.limit || 10)}
              onValueChange={(val: string) => updateFilters({ limit: parseInt(val), page: 1 })}
            >
              <SelectTrigger className="h-10 w-24">
                <SelectValue placeholder="Show" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 rows</SelectItem>
                <SelectItem value="10">10 rows</SelectItem>
                <SelectItem value="20">20 rows</SelectItem>
                <SelectItem value="50">50 rows</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64 border border-dashed rounded-xl bg-muted/10">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading FDP data…</p>
            </div>
          </div>
        ) : viewMode === "table" ? (
          <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="bg-muted/30">
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="h-11">
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
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="hover:bg-muted/20 border-b last:border-0 transition-colors"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-2.5">
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
                        className="h-32 text-center text-muted-foreground text-xs"
                      >
                        No FDP records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          /* Card Grid Layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((fdp) => {
              const statusConfig = getStatusConfig(fdp.fdpStatus);
              return (
                <div
                  key={fdp.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card p-5 shadow-xs hover:shadow-lg transition-all hover:border-primary/20 duration-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] font-medium px-2 py-0.5", statusConfig.bg, statusConfig.text, statusConfig.border)}
                        >
                          {fdp.fdpStatus}
                        </Badge>
                        <Badge variant={fdp.isPublic ? "outline" : "secondary"} className="text-[10px]">
                          {fdp.isPublic ? "Public" : "Private"}
                        </Badge>
                      </div>
                      <h3
                        onClick={() => {
                          setSelectedFDP(fdp);
                          setViewDialogOpen(true);
                        }}
                        className="font-semibold text-base tracking-tight leading-tight line-clamp-2 hover:text-primary cursor-pointer transition-colors mt-2"
                      >
                        {fdp.title}
                      </h3>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <FDPActions
                        fdp={fdp}
                        onDelete={handleDelete}
                        onEdit={(id) => {
                          setSelectedFDP(fdp);
                          setEditDialogOpen(true);
                        }}
                        onView={(id) => {
                          setSelectedFDP(fdp);
                          setViewDialogOpen(true);
                        }}
                        session={session}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                    {fdp.description || "No description provided."}
                  </p>

                  <div className="space-y-3.5 mt-4">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t pt-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 opacity-60" />
                        <span>{fdp.startDate ? new Date(fdp.startDate).toLocaleDateString() : "—"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <Building className="w-3.5 h-3.5 opacity-60 mr-1" />
                        <span className="truncate max-w-[100px]">{fdp.organizedBy || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && data.length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-dashed">
            <p>
              Showing {data.length} of {totalRecords} FDPs
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page! <= 1}
                onClick={() => updateFilters({ page: filters.page! - 1 })}
                className="h-8"
              >
                Previous
              </Button>
              <span className="text-[11px] font-medium px-2">
                Page {filters.page} of {Math.ceil(totalRecords / (filters.limit || 10))}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page! >= Math.ceil(totalRecords / (filters.limit || 10))}
                onClick={() => updateFilters({ page: filters.page! + 1 })}
                className="h-8"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog Modal */}
      {selectedFDP && (
        <FDPEditForm
          fdpId={selectedFDP.id}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setSelectedFDP(null);
          }}
          onSuccess={fetchData}
        />
      )}

      {/* View Dialog Modal */}
      {selectedFDP && (
        <FDPViewDialog
          fdp={selectedFDP}
          open={viewDialogOpen}
          onOpenChange={(open) => {
            setViewDialogOpen(open);
            if (!open) setSelectedFDP(null);
          }}
        />
      )}
    </>
  );
}
