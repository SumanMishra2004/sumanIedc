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
  LayoutGrid,
  List,
  Search,
  Lightbulb,
  Calendar,
  Funnel,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { FilterDialog } from "./patentFilterDialog";
import { ExportDialog } from "./patentExportDialog";
import { Patent, PatentFilters } from "@/types/patent";
import PatentAddForm from "./patentAddForm";
import { PatentStatus } from "@prisma/client";
import { toast } from "sonner";
import {
  getPatents,
  deletePatent,
  bulkDeletePatents,
} from "@/lib/research/patentApi";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "../ui/card";
import { AnimatedAvatarGroupTooltip } from "../ui/animated-tooltip";
import { useState } from "react";
import EditPatentDialog from "./patentEditForm";
import { PatentViewDialog } from "./viewDialog";

// Status configuration
const getStatusConfig = (status: PatentStatus) => {
  const configs = {
    GRANTED: {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-800",
      dot: "bg-emerald-500",
    },
    APPROVED: {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800",
      dot: "bg-blue-500",
    },
    SUBMITTED: {
      bg: "bg-purple-50 dark:bg-purple-950/30",
      text: "text-purple-700 dark:text-purple-400",
      border: "border-purple-200 dark:border-purple-800",
      dot: "bg-purple-500",
    },
    UNDER_REVIEW: {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-800",
      dot: "bg-amber-500",
    },
    REJECTED: {
      bg: "bg-red-50 dark:bg-red-950/30",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-200 dark:border-red-800",
      dot: "bg-red-500",
    },
  };
  return configs[status] || configs.SUBMITTED;
};

// Actions Component
interface PatentActionsProps {
  patent: Patent;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
}

const PatentActions = ({ patent, onDelete, onEdit, onView }: PatentActionsProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="h-8 w-8 p-0">
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onView(patent.id)}>
        <Eye className="mr-2 h-4 w-4" />
        View Details
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onEdit(patent.id)}>
        <Edit className="mr-2 h-4 w-4" />
        Edit Patent
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => {
          if (confirm("Are you sure you want to delete this patent?")) {
            onDelete(patent.id);
          }
        }}
        className="text-destructive"
      >
        <Trash className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

// Column definitions function
const createColumns = ({
  onDelete,
  onEdit,
  onView,
}: {
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
}): ColumnDef<Patent>[] => [
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
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 data-[state=open]:bg-accent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const title = row.getValue("title") as string;
      return (
        <div className="flex flex-col">
          <span className="font-semibold truncate max-w-60 text-foreground">
            {title.length > 60 ? title.slice(0, 60) + "..." : title}
          </span>
          <span className="text-xs text-muted-foreground truncate max-w-60">
            {row.original.grantedPatentNo || row.original.applicationNo || "No number assigned"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "patentStatus",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("patentStatus") as PatentStatus;
      const config = getStatusConfig(status);
      return (
        <Badge
          variant="outline"
          className={`${config.bg} ${config.text} ${config.border} font-medium px-2.5 py-1`}
        >
          <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${config.dot}`} />
          {status.replace(/_/g, " ")}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "Authors",
    header: "Authors",
    cell: ({ row }) => {
      const students = row.original.studentAuthors || [];
      const teachers = row.original.facultyAuthors || [];
      const authors = [...students, ...teachers].map((author, index) => ({
        name: author.user.name || "Unknown",
        email: author.user.email || "No email",
        image: author.user.image || undefined,
        id: index
      }));
      return (
        <div className="flex items-center gap-2">
          <AnimatedAvatarGroupTooltip items={authors} maxCount={3} />
        </div>
      );
    },
  },
  {
    accessorKey: "applicationNo",
    header: () => <div className="text-right">Application No</div>,
    cell: ({ row }) => {
      const appNo = row.getValue("applicationNo") as string | null;
      return (
        <div className="text-right font-mono text-sm">
          {appNo || "—"}
        </div>
      )
    }
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return (
        <div className="text-sm text-muted-foreground">
          {date.toLocaleDateString()}
        </div>
      );
    },
  },
  {
    accessorKey: "grantDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Grant Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.original.grantDate;
      return date ? (
        <div className="text-sm text-muted-foreground">
          {new Date(date).toLocaleDateString()}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">—</div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => (
      <PatentActions
        patent={row.original}
        onDelete={onDelete}
        onEdit={onEdit}
        onView={onView}
      />
    ),
  },
];

// Main Table Component
interface PatentTableProps {
  onRefresh?: () => void;
}

export default function PatentTable({ onRefresh }: PatentTableProps) {
  const [data, setData] = React.useState<Patent[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [totalRecords, setTotalRecords] = React.useState(0);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [viewMode, setViewMode] = React.useState<"table" | "card">("table");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPatentId, setEditingPatentId] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingPatentId, setViewingPatentId] = useState<string | null>(null);
  const [filters, setFilters] = React.useState<PatentFilters>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Fetch data from API
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getPatents(filters);
      if (response.data) {
        setData(response.data.patents);
        console.log("Fetched patents:", response.data.patents);
        setTotalRecords(response.data.pagination.total);
      } else if (response.error) {
        toast.error("Failed to load patents", {
          description: response.error,
        });
      }
    } catch (error) {
      console.error("Error fetching patents:", error);
      toast.error("Failed to load patents");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Fetch data on filter changes
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update filter with search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        setFilters(prev => ({ ...prev, search: searchTerm.trim(), page: 1 }));
      } else {
        setFilters(prev => {
          const newFilters = { ...prev };
          delete newFilters.search;
          return newFilters;
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter management functions
  const updateFilter = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === "page" || key === "limit" ? value : 1,
    }));
  };

  const updateFilters = (newFilters: Partial<PatentFilters>) => {
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

  // Handle delete
  const handleDelete = React.useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this patent?")) return;

    try {
      const response = await deletePatent(id);
      if (response.data) {
        toast.success("Patent deleted successfully");
        fetchData();
        onRefresh?.();
      } else if (response.error) {
        toast.error("Failed to delete patent", {
          description: response.error,
        });
      }
    } catch (error) {
      console.error("Error deleting patent:", error);
      toast.error("An error occurred while deleting");
    }
  }, [fetchData, onRefresh]);

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${Object.keys(rowSelection).length} patents?`))
      return;

    try {
      const selectedIds = Object.keys(rowSelection);
      const response = await bulkDeletePatents(selectedIds);
      if (response.data) {
        toast.success(`${response.data.count} patents deleted successfully`);
        setRowSelection({});
        fetchData();
        onRefresh?.();
      } else if (response.error) {
        toast.error("Failed to delete patents", {
          description: response.error,
        });
      }
    } catch (error) {
      console.error("Error bulk deleting patents:", error);
      toast.error("An error occurred during bulk delete");
    }
  };

  // Column definitions
  const columns = React.useMemo(
    () =>
      createColumns({
        onDelete: handleDelete,
        onEdit: (id) => {
          setEditingPatentId(id);
          setEditDialogOpen(true);
        },
        onView: (id) => {
          setViewingPatentId(id);
          setViewDialogOpen(true);
        },
      }),
    [handleDelete]
  );

  // Table instance
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

  // Active filter count
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.patentStatus) count++;
    if (filters.teacherStatus) count++;
    if (filters.isPublic !== undefined) count++;
    if (filters.filingDateFrom || filters.filingDateTo) count++;
    if (filters.grantDateFrom || filters.grantDateTo) count++;
    if (filters.facultyAuthorIds?.length) count++;
    if (filters.studentAuthorIds?.length) count++;
    return count;
  }, [filters]);

  return (
    <>
      <Card className="w-full p-3! border-dashed border-2 border-chart-2 gap-3!">
        {/* Header Section */}
        <CardHeader className="space-y-4 border-b p-0!">
          <div className="flex flex-col gap-4 sm:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <Lightbulb className="h-6 w-6 text-chart-2" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Patents
                </h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(rowSelection).length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="shadow-lg"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete ({Object.keys(rowSelection).length})
                </Button>
              )}
              <ExportDialog
                triggerButton={
                  <Button
                    variant="secondary"
                    size="sm"
                    className="shadow-lg bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                }
              />
              <PatentAddForm 
                onSuccess={fetchData}
                onClose={() => fetchData()}
              />
            </div>
          </div>
        </CardHeader>

        {/* Toolbar */}
        <CardContent
          className="
            rounded-lg border bg-card p-4 shadow-sm
            flex flex-col gap-4
            lg:flex-row lg:items-center lg:justify-between
          "
        >
          {/* LEFT SECTION */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
            {/* Search */}
            <div className="relative w-full lg:w-78">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
                className="h-9 pl-9 bg-background"
              />
            </div>

            <Separator orientation="vertical" className="hidden sm:block h-6" />

            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="
                    h-9 gap-2
                    border-dashed
                    bg-muted/40 hover:bg-muted
                  "
                >
                  <ChevronDown className="h-4 w-4" />
                  <span className="whitespace-nowrap">
                    Status {filters.patentStatus && `(${filters.patentStatus.replace(/_/g, ' ')})`}
                  </span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => {
                    setFilters(prev => {
                      const newFilters = { ...prev };
                      delete newFilters.patentStatus;
                      return newFilters;
                    });
                  }}
                >
                  All Statuses
                </DropdownMenuItem>

                {Object.values(PatentStatus).map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => updateFilter("patentStatus", status)}
                  >
                    {status.replace(/_/g, ' ')}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* RIGHT SECTION */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Advanced Filter Button */}
            <FilterDialog
              filters={filters}
              onFiltersChange={updateFilters}
              onClearFilters={clearFilters}
              triggerButton={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 border-dashed relative"
                >
                  <Funnel className="mr-2 h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              }
            />

            {/* View Toggle */}
            <div className="border rounded-lg p-1 flex items-center bg-background">
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2"
                onClick={() => setViewMode("table")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "card" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2"
                onClick={() => setViewMode("card")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>

            {/* Items Per Page */}
            <Select
              value={String(filters.limit || 10)}
              onValueChange={(value) => updateFilter("limit", parseInt(value))}
            >
              <SelectTrigger className="h-9 w-25">
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
        </CardContent>

        {/* Content Area */}
        <CardContent className="h-fit p-0!">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          ) : viewMode === "table" ? (
            <div className="rounded-md border bg-card shadow-sm overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                      className="bg-muted/50 hover:bg-muted/50"
                    >
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id} className="h-10">
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
                        className="cursor-pointer hover:bg-muted/30"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-3">
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
                        className="h-24 text-center text-muted-foreground"
                      >
                        No results found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {table.getRowModel().rows.map((row) => {
                const patent = row.original;
                const students = patent.studentAuthors || [];
                const teachers = patent.facultyAuthors || [];
                return (
                  <div
                    key={row.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-muted p-5 shadow-sm transition-all hover:shadow-2xl hover:border-primary/20 hover:scale-105 duration-400"
                  >
                    <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                      <PatentActions
                        patent={patent}
                        onDelete={handleDelete}
                        onEdit={(id) => {
                          setEditingPatentId(id);
                          setEditDialogOpen(true);
                        }}
                        onView={(id) => {
                          setViewingPatentId(id);
                          setViewDialogOpen(true);
                        }}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <Badge
                          variant="outline"
                          className={`font-medium border ${getStatusConfig(patent.patentStatus).bg} ${getStatusConfig(patent.patentStatus).text} ${getStatusConfig(patent.patentStatus).border}`}
                        >
                          {patent.patentStatus.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <h3 className="line-clamp-2 font-semibold leading-tight text-foreground">
                          {patent.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {patent.abstract || "No abstract available"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {patent.keywords.slice(0, 3).map((keyword, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>

                      <div className="space-y-2 text-xs text-muted-foreground">
                        {patent.grantedPatentNo && (
                          <div className="flex items-center gap-2">
                            <Lightbulb className="h-3 w-3" />
                            <span>{patent.grantedPatentNo}</span>
                          </div>
                        )}
                        {patent.grantDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(patent.grantDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2">
                        <AnimatedAvatarGroupTooltip
                          items={[...students, ...teachers].map((author, index) => ({
                            name: author.user.name || "Unknown",
                            email: author.user.email || "No email",
                            image: author.user.image || undefined,
                            id: index
                          }))}
                          maxCount={3}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        {/* Footer / Pagination */}
        <CardFooter className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Showing {data.length > 0 ? ((filters.page || 1) - 1) * (filters.limit || 10) + 1 : 0} to{" "}
            {Math.min((filters.page || 1) * (filters.limit || 10), totalRecords)} of {totalRecords} patents
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFilter("page", (filters.page || 1) - 1)}
              disabled={!filters.page || filters.page <= 1}
            >
              Previous
            </Button>
            <div className="text-sm font-medium">
              Page {filters.page || 1} of {Math.ceil(totalRecords / (filters.limit || 10))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFilter("page", (filters.page || 1) + 1)}
              disabled={(filters.page || 1) >= Math.ceil(totalRecords / (filters.limit || 10))}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Edit Patent Dialog */}
      <EditPatentDialog
        patentId={editingPatentId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          fetchData();
          onRefresh?.();
        }}
      />

      {/* View Patent Dialog */}
      <PatentViewDialog
        patentId={viewingPatentId}
        open={viewDialogOpen}
        setOpen={setViewDialogOpen}
        setViewingPatentId={setViewingPatentId}
      />
    </>
  );
}
