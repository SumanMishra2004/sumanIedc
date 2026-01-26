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
  FileText,
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
import { FilterDialog } from "./journalFilterDialog";
import { ExportDialog } from "./journalExportDialog";

import { Journal, JournalFilters } from "@/types/journal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import JournalDialog from "./journalAddForm";
import { ResearchStatus, JournalType } from "@prisma/client";
import { toast } from "sonner";
import {
  getJournals,
  deleteJournal,
  bulkDeleteJournals,
  exportJournalsToCSV,
  searchJournals,
  getJournalsByStatus,
} from "@/lib/journalApi";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { AnimatedAvatarGroupTooltip } from "../ui/animated-tooltip";

// --- Types & Data ---

type PublicationStatus = ResearchStatus;

const getStatusConfig = (status: PublicationStatus) => {
  const configs = {
    PUBLISHED: {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-800",
      dot: "bg-emerald-500",
      icon: "✓"
    },
    APPROVED: {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800",
      dot: "bg-blue-500",
      icon: "✓"
    },
    SUBMITTED: {
      bg: "bg-purple-50 dark:bg-purple-950/30",
      text: "text-purple-700 dark:text-purple-400",
      border: "border-purple-200 dark:border-purple-800",
      dot: "bg-purple-500",
      icon: "↑"
    },
    UNDER_REVIEW: {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-800",
      dot: "bg-amber-500",
      icon: "⌛"
    },
    REVISION: {
      bg: "bg-orange-50 dark:bg-orange-950/30",
      text: "text-orange-700 dark:text-orange-400",
      border: "border-orange-200 dark:border-orange-800",
      dot: "bg-orange-500",
      icon: "↻"
    },
    DRAFT: {
      bg: "bg-slate-50 dark:bg-slate-900/30",
      text: "text-slate-600 dark:text-slate-400",
      border: "border-slate-200 dark:border-slate-700",
      dot: "bg-slate-400",
      icon: "✎"
    },
    REJECTED: {
      bg: "bg-red-50 dark:bg-red-950/30",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-200 dark:border-red-800",
      dot: "bg-red-500",
      icon: "✕"
    }
  };
  return configs[status];
};

const getJournalTypeConfig = (type: JournalType) => {
  const configs: Record<JournalType, { bg: string; text: string; border: string }> = {
    INTERNATIONAL: {
      bg: "bg-violet-50 dark:bg-violet-950/30",
      text: "text-violet-700 dark:text-violet-400",
      border: "border-violet-200 dark:border-violet-800",
    },
    NATIONAL: {
      bg: "bg-indigo-50 dark:bg-indigo-950/30",
      text: "text-indigo-700 dark:text-indigo-400",
      border: "border-indigo-200 dark:border-indigo-800",
    },
    PEER_REVIEWED: {
      bg: "bg-lime-50 dark:bg-lime-950/30",
      text: "text-lime-700 dark:text-lime-400",
      border: "border-lime-200 dark:border-lime-800",
    },
    OPEN_ACCESS: {
      bg: "bg-cyan-50 dark:bg-cyan-950/30",
      text: "text-cyan-700 dark:text-cyan-400",
      border: "border-cyan-200 dark:border-cyan-800",
    },
    OTHER: {
      bg: "bg-gray-50 dark:bg-gray-950/30",
      text: "text-gray-700 dark:text-gray-400",
      border: "border-gray-200 dark:border-gray-800",
    },
  };
  return configs[type];
};

// --- Actions Component ---
interface JournalActionsProps {
  journal: Journal;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
}

const JournalActions = ({
  journal,
  onDelete,
  onEdit,
  onView,
}: JournalActionsProps) => (
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
        onClick={() => navigator.clipboard.writeText(journal.id)}
      >
        Copy ID
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onView?.(journal.id)}>
        <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
        View details
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onEdit?.(journal.id)}>
        <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
        Edit journal
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="text-red-600 focus:text-red-600 focus:bg-red-50"
        onClick={() => onDelete(journal.id)}
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

export const createColumns = ({
  onDelete,
  onEdit,
  onView,
}: ColumnProps): ColumnDef<Journal>[] => [
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
    accessorKey: "serialNo",
    header: "Serial No",
    cell: ({ row }) => {
      const serialNo = row.getValue("serialNo") as string;
      return (
        <div className="font-mono text-sm font-medium">
          {serialNo}
        </div>
      );
    },
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
          Paper Title
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
            {row.original.abstract?.length ? row.original.abstract.slice(0, 60) + "..." : "No abstract"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "titleOfJournal",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 data-[state=open]:bg-accent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Journal Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const titleOfJournal = row.getValue("titleOfJournal") as string;
      return (
        <div className="font-medium truncate max-w-48">
          {titleOfJournal}
        </div>
      );
    },
  },
  {
    accessorKey: "journalType",
    header: "Journal Type",
    cell: ({ row }) => {
      const type = row.getValue("journalType") as JournalType;
      const config = getJournalTypeConfig(type);
      return (
        <Badge
          variant="outline"
          className={`${config.bg} ${config.text} ${config.border} font-medium px-2.5 py-1`}
        >
          {type.replace(/_/g, " ")}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "impactFactor",
    header: () => <div className="text-right">Impact Factor</div>,
    cell: ({ row }) => {
      const impactFactor = row.getValue("impactFactor") as number | null;
      return (
        <div className="text-right font-mono text-sm font-medium">
          {impactFactor !== null ? impactFactor.toFixed(2) : "—"}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as PublicationStatus;
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
    accessorKey: "publicationDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Published At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="text-sm text-muted-foreground">
          {row.getValue("publicationDate") ? new Date(row.getValue("publicationDate")).toLocaleDateString() : "—"}
        </div>
      );
    },
  },
  {
    accessorKey: "journalPublisher",
    header: "Publisher",
    cell: ({ row }) => {
      const publisher = row.getValue("journalPublisher") as string | null;
      return (
        <div className="text-sm truncate max-w-32">
          {publisher || "—"}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <JournalActions
        journal={row.original}
        onDelete={onDelete}
        onEdit={onEdit}
        onView={onView}
      />
    ),
  },
];

// --- Main Component ---

interface JournalTableProps {
  initialData?: Journal[];
  initialTotal?: number;
  onRefresh?: () => void;
}

export default function JournalTable({
  initialData = [],
  initialTotal = 0,
  onRefresh,
}: JournalTableProps) {
  const [data, setData] = React.useState<Journal[]>(initialData);
  const [totalRecords, setTotalRecords] = React.useState(initialTotal);
  const [isLoading, setIsLoading] = React.useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [viewMode, setViewMode] = React.useState<"table" | "card">("table");
  const [searchTerm, setSearchTerm] = React.useState("");

  const [filters, setFilters] = React.useState<JournalFilters>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Fetch data from API
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getJournals(filters);
      if (response.data) {
        setData(response.data.journals);
        console.log("Fetched journals:", response.data.journals);
        setTotalRecords(response.data.pagination.total);
      } else if (response.error) {
        toast.error("Failed to load journals", {
          description: response.error,
        });
      }
    } catch (error) {
      console.error("Error fetching journals:", error);
      toast.error("Failed to load journals");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Fetch data on filter changes
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update filter with search term using searchJournals
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        const { search, ...rest } = filters;
        setFilters({ ...rest, search: searchTerm.trim(), page: 1 });
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
      // Reset to page 1 only when changing filters other than page/limit
      page: key === "page" || key === "limit" ? value : 1,
    }));
  };

  const updateFilters = (newFilters: Partial<JournalFilters>) => {
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
    if (!confirm("Are you sure you want to delete this journal?")) return;

    try {
      const response = await deleteJournal(id);
      if (response.data) {
        toast.success("Journal deleted successfully");
        fetchData();
        onRefresh?.();
      } else if (response.error) {
        toast.error("Failed to delete journal", {
          description: response.error,
        });
      }
    } catch (error) {
      console.error("Error deleting journal:", error);
      toast.error("Failed to delete journal");
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) {
      toast.error("Please select journals to delete");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.length} journal(s)?`,
      )
    )
      return;

    try {
      const response = await bulkDeleteJournals(selectedIds);
      if (response.data) {
        toast.success(
          `Successfully deleted ${response.data.count} journal(s)`,
        );
        setRowSelection({});
        fetchData();
        onRefresh?.();
      } else if (response.error) {
        toast.error("Failed to delete journals", {
          description: response.error,
        });
      }
    } catch (error) {
      console.error("Error bulk deleting journals:", error);
      toast.error("Failed to delete journals");
    }
  };

  // Create columns with handlers
  const columns = React.useMemo(
    () =>
      createColumns({
        onDelete: handleDelete,
        onEdit: (id) => {
          toast.info("Edit functionality coming soon");
        },
        onView: (id) => {
          toast.info("View functionality coming soon");
        },
      }),
    [],
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
      pagination: {
        pageIndex: (filters.page || 1) - 1,
        pageSize: filters.limit || 10,
      },
    },
    manualPagination: true,
    pageCount: Math.ceil(totalRecords / (filters.limit || 10)),
  });

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
    <Card className="w-full p-3! border-dashed border-2 border-chart-2 gap-3! ">
      {/* Header Section */}
      <CardHeader className="space-y-4 border-b p-0!">
        <div className="flex flex-col gap-4 sm:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                <FileText className="h-6 w-6 text-chart-2" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Journal Publications
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
            <JournalDialog 
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
              placeholder="Search titles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
              className="h-9 pl-9 bg-background "
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
                  Status {filters.status && `(${filters.status})`}
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => {
                  const { status, ...rest } = filters;
                  setFilters({ ...rest, page: 1 });
                }}
              >
                All Statuses
              </DropdownMenuItem>

              {[
                "DRAFT",
                "SUBMITTED",
                "UNDER_REVIEW",
                "REVISION",
                "APPROVED",
                "PUBLISHED",
                "REJECTED",
              ].map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => setFilters(prev => ({ ...prev, status: status as any, page: 1 }))}
                  className="flex items-center gap-2"
                >
                  <span
                    className={`h-2 w-2 rounded-full ${getStatusConfig(status as PublicationStatus).dot}`}
                  />
                  <span className="capitalize text-sm">
                    {status.replace(/_/g, " ").toLowerCase()}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Journal Type Filter */}
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
                  Type {filters.journalType && `(${filters.journalType})`}
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel>Journal Type</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => {
                  const { journalType, ...rest } = filters;
                  setFilters({ ...rest, page: 1 });
                }}
              >
                All Types
              </DropdownMenuItem>

              {[
                "SCOPUS",
                "WEB_OF_SCIENCE",
                "SCI",
                "UGC_CARE",
                "PEER_REVIEWED",
                "OTHER",
              ].map((type) => (
                <DropdownMenuItem
                  key={type}
                  onClick={() => setFilters(prev => ({ ...prev, journalType: type as any, page: 1 }))}
                  className="flex items-center gap-2"
                >
                  <span className="text-sm">
                    {type.replace(/_/g, " ")}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <FilterDialog
            filters={filters}
            onFiltersChange={updateFilters}
            onClearFilters={clearFilters}
          />

          {/* View Toggle */}
          <div className="flex items-center rounded-md border bg-background p-1 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("table")}
              className={`h-7 w-7 ${
                viewMode === "table"
                  ? "bg-muted shadow-sm"
                  : "hover:bg-transparent"
              }`}
            >
              <List className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("card")}
              className={`h-7 w-7 ${
                viewMode === "card"
                  ? "bg-muted shadow-sm"
                  : "hover:bg-transparent"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          {/* Columns (Desktop only) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex h-9 gap-2 bg-muted/40 hover:bg-muted"
              >
                Columns
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                    className="capitalize"
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>

      {/* Content Area */}
      <CardContent className="h-fit p-0!">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : viewMode === "table" ? (
          <div className="rounded-md border bg-card shadow-sm overflow-x-auto scroll-m-1 scrollbar-gradient">
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
                                header.getContext(),
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
                            cell.getContext(),
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
              const journal = row.original;
              const students = journal.studentAuthors || [];
              const teachers = journal.facultyAuthors || [];
              const typeConfig = getJournalTypeConfig(journal.journalType);
              return (
                <div
                  key={row.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-muted p-5 shadow-sm transition-all hover:shadow-2xl hover:border-primary/20 hover:scale-105 duration-400"
                >
                  <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <JournalActions
                      journal={journal}
                      onDelete={handleDelete}
                      onEdit={(id) =>
                        toast.info("Edit functionality coming soon")
                      }
                      onView={(id) =>
                        toast.info("View functionality coming soon")
                      }
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={`font-medium border ${getStatusConfig(journal.status).bg} ${getStatusConfig(journal.status).text} ${getStatusConfig(journal.status).border}`}
                      >
                        {journal.status.replace(/_/g, " ")}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`font-medium border ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border} text-xs`}
                      >
                        {journal.journalType.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <h3 className="line-clamp-2 font-semibold leading-tight text-foreground">
                        {journal.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {journal.titleOfJournal}
                      </p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {journal.abstract || "No description provided."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{students.length + teachers.length} Authors</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {journal.publicationDate 
                            ? new Date(journal.publicationDate).toLocaleDateString() 
                            : "Not published"}
                        </span>
                      </div>
                    </div>

                    {journal.impactFactor && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <span className="text-xs text-muted-foreground">Impact Factor:</span>
                        <span className="font-mono font-semibold text-sm">{journal.impactFactor.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t pt-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                        Publisher
                      </span>
                      <span className="text-xs font-medium truncate max-w-32">
                        {journal.journalPublisher || "—"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs bg-accent hover:bg-accent/80"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Pagination */}
      <CardFooter className="flex flex-col-reverse items-center justify-between gap-4 border-t pt-4 sm:flex-row">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>
            {Object.keys(rowSelection).length} of {data.length} row(s) selected
          </span>
          <span className="text-xs">
            (Showing {(currentPage - 1) * (filters.limit || 10) + 1} to{" "}
            {Math.min(currentPage * (filters.limit || 10), totalRecords)} of{" "}
            {totalRecords})
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground hidden sm:block">
              Rows per page
            </p>
            <Select
              value={`${filters.limit || 10}`}
              onValueChange={(value) => handlePageSizeChange(Number(value))}
              disabled={isLoading}
            >
              <SelectTrigger className="h-8 w-16 bg-accent text-black ">
                <SelectValue className="text-xs" placeholder={filters.limit || 10} />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 30, 50].map((pageSize) => (
                  <SelectItem
                    key={pageSize}
                    value={`${pageSize}`}
                    className="text-black!"
                  >
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
      </CardFooter>
    </Card>
  );
}
