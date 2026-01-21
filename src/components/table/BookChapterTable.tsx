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
  Users,
  Calendar,
  DollarSign,
  Funnel,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Download } from "../animate-ui/icons/download";
import { FilterDialog } from "./bookchapterFilterDialog.";
import { BookChapter, BookChapterFilters } from "@/types/book-chapter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import BookChapterAddForm from "./bookChapterAddForm";
import { ResearchStatus } from "@prisma/client";
import { toast } from "sonner";
import {
  getBookChapters,
  deleteBookChapter,
  bulkDeleteBookChapters,
  exportBookChaptersToCSV,
} from "@/lib/bookChapterApi";

// --- Types & Data ---

type PublicationStatus = ResearchStatus;


// Helper for status styling
const getStatusBadgeVariant = (status: PublicationStatus) => {
  switch (status) {
    case "PUBLISHED":
      return "default";
    case "SUBMITTED":
    case "UNDER_REVIEW":
    case "REVISION":
    case "APPROVED":
      return "secondary";
    case "DRAFT":
      return "outline";
    case "REJECTED":
      return "destructive";
    default:
      return "secondary";
  }
};

const getStatusColorClass = (status: PublicationStatus) => {
  switch (status) {
    case "PUBLISHED":
    case "APPROVED":
      return "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200";
    case "SUBMITTED":
    case "UNDER_REVIEW":
      return "bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-200";
    case "REVISION":
      return "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-200";
    case "DRAFT":
      return "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200";
    case "REJECTED":
      return "bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-200";
    default:
      return "";
  }
};

// --- Actions Component ---
interface ChapterActionsProps {
  chapter: BookChapter;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
}

const ChapterActions = ({ chapter, onDelete, onEdit, onView }: ChapterActionsProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-[160px]">
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
      <DropdownMenuItem
        onClick={() => navigator.clipboard.writeText(chapter.id)}
      >
        Copy ID
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onView?.(chapter.id)}>
        <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
        View details
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onEdit?.(chapter.id)}>
        <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
        Edit chapter
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="text-red-600 focus:text-red-600 focus:bg-red-50"
        onClick={() => onDelete(chapter.id)}
      >
        <Trash className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

// --- Table Columns ---

interface ColumnProps {
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
}

export const createColumns = ({ onDelete, onEdit, onView }: ColumnProps): ColumnDef<BookChapter>[] => [
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
          className="-ml-3 h-8 data-[state=open]:bg-accent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-semibold truncate max-w-[250px] text-foreground">
          {row.getValue("title")}
        </span>
        <span className="text-xs text-muted-foreground truncate max-w-[250px]">
          {row.original.abstract || "No abstract"}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as PublicationStatus;
      return (
        <Badge
          variant="outline"
          className={`font-medium border ${getStatusColorClass(status)}`}
        >
          {status.replace(/_/g, " ")}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "studentAuthors",
    header: "Authors",
    cell: ({ row }) => {
      const students = row.original.studentAuthors || [];
      const teachers = row.original.facultyAuthors || [];
      const count = students.length + teachers.length;
      return (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{count} Authors</span>
        </div>
      );
    },
  },
  {
    accessorKey: "registrationFees",
    header: () => <div className="text-right">Reg. Fees</div>,
    cell: ({ row }) => {
      const fees = row.getValue("registrationFees") as number | null;
      const formatted =
        fees !== null
          ? new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(fees)
          : "—";

      return <div className="text-right font-mono text-sm">{formatted}</div>;
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Updated
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("updatedAt"));
      return <div className="text-sm text-muted-foreground">{date.toLocaleDateString()}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ChapterActions chapter={row.original} onDelete={onDelete} onEdit={onEdit} onView={onView} />,
  },
];

// --- Main Component ---

interface BookChapterTableProps {
  initialData?: BookChapter[];
  initialTotal?: number;
  onRefresh?: () => void;
}

export default function BookChapterTable({ 
  initialData = [], 
  initialTotal = 0,
  onRefresh
}: BookChapterTableProps) {
  const [data, setData] = React.useState<BookChapter[]>(initialData);
  const [totalRecords, setTotalRecords] = React.useState(initialTotal);
  const [isLoading, setIsLoading] = React.useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [viewMode, setViewMode] = React.useState<"table" | "card">("table");
  const [isExportHovered, setIsExportHovered] = React.useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  
  const [filters, setFilters] = React.useState<BookChapterFilters>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Fetch data from API
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getBookChapters(filters);
      if (response.data) {
        setData(response.data.bookChapters);
        setTotalRecords(response.data.pagination.total);
      } else if (response.error) {
        toast.error("Failed to load book chapters", {
          description: response.error
        });
      }
    } catch (error) {
      console.error("Error fetching book chapters:", error);
      toast.error("Failed to load book chapters");
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
      if (searchTerm) {
        updateFilter("search", searchTerm);
      } else {
        const { search, ...rest } = filters;
        setFilters(rest);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter management functions
  const updateFilter = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === "page" || key === "limit" ? prev.page : 1,
    }));
  };

  const updateFilters = (newFilters: Partial<BookChapterFilters>) => {
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
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this book chapter?")) return;
    
    try {
      const response = await deleteBookChapter(id);
      if (response.data) {
        toast.success("Book chapter deleted successfully");
        fetchData();
        onRefresh?.();
      } else if (response.error) {
        toast.error("Failed to delete book chapter", {
          description: response.error
        });
      }
    } catch (error) {
      console.error("Error deleting book chapter:", error);
      toast.error("Failed to delete book chapter");
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) {
      toast.error("Please select chapters to delete");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.length} book chapter(s)?`)) return;

    try {
      const response = await bulkDeleteBookChapters(selectedIds);
      if (response.data) {
        toast.success(`Successfully deleted ${response.data.count} book chapter(s)`);
        setRowSelection({});
        fetchData();
        onRefresh?.();
      } else if (response.error) {
        toast.error("Failed to delete book chapters", {
          description: response.error
        });
      }
    } catch (error) {
      console.error("Error bulk deleting book chapters:", error);
      toast.error("Failed to delete book chapters");
    }
  };

  // Create columns with handlers
  const columns = React.useMemo(
    () => createColumns({ 
      onDelete: handleDelete,
      onEdit: (id) => {
        toast.info("Edit functionality coming soon");
      },
      onView: (id) => {
        toast.info("View functionality coming soon");
      }
    }),
    []
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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    manualPagination: true,
    pageCount: Math.ceil(totalRecords / (filters.limit || 10)),
  });

  // Export CSV Function
  const exportCSV = async () => {
    try {
      await exportBookChaptersToCSV(filters);
      toast.success("CSV export started");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV");
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    updateFilter("page", newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setFilters((prev) => ({
      ...prev,
      limit: newSize,
      page: 1,
    }));
  };

  const totalPages = Math.ceil(totalRecords / (filters.limit || 10));
  const currentPage = filters.page || 1;

  return (
    <div className="w-full space-y-6 p-1">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Book Chapters
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your publication entries, authors, and statuses. Total: {totalRecords}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {Object.keys(rowSelection).length > 0 && (
            <Button 
              variant="destructive" 
              size="sm" 
              className="h-9" 
              onClick={handleBulkDelete}
            >
              <Trash className="mr-2 h-4 w-4" /> Delete Selected ({Object.keys(rowSelection).length})
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 bg-accent hover:bg-accent/80" 
            onClick={exportCSV}
            onMouseEnter={() => setIsExportHovered(true)}
            onMouseLeave={() => setIsExportHovered(false)}
            disabled={isLoading}
          >
            <Download animate={isExportHovered} animation="default-loop" className="mr-2 h-4 w-4" /> Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 bg-chart-3 duration-800 cursor-pointer transition-all  hover:bg-accent border-green-600 hover:text-primary-foreground hover:border-accent/80 active:bg-accent/80 active:text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> Add Chapter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Book Chapter</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new book chapter entry.
                </DialogDescription>
              </DialogHeader>
              <BookChapterAddForm 
                onSuccess={() => {
                  setIsAddDialogOpen(false);
                  fetchData();
                  onRefresh?.();
                }}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search titles..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-9 pl-9 w-full bg-background"
              disabled={isLoading}
            />
          </div>
          <Separator orientation="vertical" className="hidden h-6 md:block" />
          
          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 border-dashed bg-accent hover:bg-accent/80" disabled={isLoading}>
                <ChevronDown className="mr-2 h-4 w-4" />
                Status {filters.status && `(${filters.status})`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[180px]">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                const { status, ...rest } = filters;
                setFilters(rest);
              }}>
                All Statuses
              </DropdownMenuItem>
              {["DRAFT", "SUBMITTED", "UNDER_REVIEW", "REVISION", "APPROVED", "PUBLISHED", "REJECTED"].map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => updateFilter("status", status)}
                >
                  <Badge variant="outline" className={`mr-2 h-2 w-2 rounded-full p-0 border-0 ${getStatusColorClass(status as PublicationStatus).replace("text-", "bg-")}`} />
                  <span className="capitalize">{status.replace(/_/g, " ").toLowerCase()}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <FilterDialog
            filters={filters}
            onFiltersChange={updateFilters}
            onClearFilters={clearFilters}
          />
           {/* View Toggle */}
           <div className="flex items-center rounded-md border bg-background p-0.5 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-sm ${viewMode === "table" ? " shadow-sm bg-accent hover:bg-accent/80" : "hover:bg-transparent"}`}
              onClick={() => setViewMode("table")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-sm ${viewMode === "card" ? "shadow-sm bg-accent hover:bg-accent/80" : "hover:bg-transparent"}`}
              onClick={() => setViewMode("card")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 ml-auto hidden sm:flex bg-accent hover:bg-accent/80">
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
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[300px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : viewMode === "table" ? (
          <div className="rounded-md border bg-card shadow-sm overflow-x-auto scroll-m-1 scrollbar-gradient">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
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
              const chapter = row.original;
              const students = chapter.studentAuthors || [];
              const teachers = chapter.facultyAuthors || [];
              return (
                <div
                  key={row.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-muted  p-5 shadow-sm transition-all hover:shadow-2xl hover:border-primary/20 hover:scale-105 duration-400"
                >
                  <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <ChapterActions 
                      chapter={chapter} 
                      onDelete={handleDelete}
                      onEdit={(id) => toast.info("Edit functionality coming soon")}
                      onView={(id) => toast.info("View functionality coming soon")}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                        <Badge
                          variant="outline"
                          className={`font-medium border ${getStatusColorClass(chapter.status)}`}
                        >
                          {chapter.status.replace(/_/g, " ")}
                        </Badge>
                    </div>

                    <div className="space-y-1">
                        <h3 className="line-clamp-2 font-semibold leading-tight text-foreground">
                            {chapter.title}
                        </h3>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                            {chapter.abstract || "No description provided."}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            <span>{students.length + teachers.length} Authors</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{new Date(chapter.updatedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t pt-4">
                     <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">Reg Fees</span>
                        <span className="font-mono font-medium">
                            {chapter.registrationFees ? `$${chapter.registrationFees}` : "Free"}
                        </span>
                     </div>
                     <Button variant="ghost" size="sm" className="h-8 text-xs bg-accent hover:bg-accent/80">
                        View Details
                     </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col-reverse items-center justify-between gap-4 border-t pt-4 sm:flex-row">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>
                {Object.keys(rowSelection).length} of {data.length} row(s) selected
            </span>
            <span className="text-xs">
              (Showing {((currentPage - 1) * (filters.limit || 10)) + 1} to {Math.min(currentPage * (filters.limit || 10), totalRecords)} of {totalRecords})
            </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground hidden sm:block">Rows per page</p>
            <Select
              value={`${filters.limit || 10}`}
              onValueChange={(value) => handlePageSizeChange(Number(value))}
              disabled={isLoading}
            >
              <SelectTrigger className="h-8 w-14 bg-accent text-black ">
                <SelectValue placeholder={filters.limit || 10} />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 30, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`} className="text-black!">
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 bg-accent"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronDown className="h-4 w-4 rotate-90 " />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 bg-accent"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              >
                <ChevronDown className="h-4 w-4 -rotate-90" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}



