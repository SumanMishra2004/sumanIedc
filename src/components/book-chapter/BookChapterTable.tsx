"use client";

import * as React from "react";
import { useState } from "react";
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
  Plus,
  LayoutGrid,
  List,
  Search,
  BookOpen,
  Users,
  Calendar,
  DollarSign,
  MessageSquare,
  ShieldCheck,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { FilterDialog } from "./bookchapterFilterDialog.";
import { ExportDialog } from "./bookChapterExportDialog";
import { BookChapter, BookChapterFilters } from "@/types/book-chapter";
import BookChapterAddForm from "./bookChapterAddForm";
import { toast } from "sonner";
import {
  getBookChapters,
  deleteBookChapter,
  bulkDeleteBookChapters,
  updateBookChapterReviewStatus,
} from "@/lib/research/bookChapterApi";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { AnimatedAvatarGroupTooltip } from "../ui/animated-tooltip";
import { BookchapterStatus, TeacherStatus } from "@prisma/client";
import EditBookChapterDialog from "./bookChapterEditForm";
import { BookChapterViewDialog } from "./viewDialog";

// --- Types & Data ---

const getStatusConfig = (status: BookchapterStatus) => {
  const configs = {
    PUBLISHED: {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-800",
      dot: "bg-emerald-500",
      icon: "✓",
    },
    APPROVED: {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800",
      dot: "bg-blue-500",
      icon: "✓",
    },
    SUBMITTED: {
      bg: "bg-purple-50 dark:bg-purple-950/30",
      text: "text-purple-700 dark:text-purple-400",
      border: "border-purple-200 dark:border-purple-800",
      dot: "bg-purple-500",
      icon: "↑",
    },
    UNDER_REVIEW: {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-800",
      dot: "bg-amber-500",
      icon: "⌛",
    },
  };
  return configs[status] || configs.SUBMITTED;
};

const getTeacherStatusConfig = (status: TeacherStatus) => {
  const configs = {
    PUBLISHED: { dot: "bg-emerald-500", text: "text-emerald-600" },
    ACCEPTED: { dot: "bg-emerald-500", text: "text-emerald-600" },
    UPDATE: { dot: "bg-amber-500", text: "text-amber-600" },
    REJECTED: { dot: "bg-red-500", text: "text-red-600" },
    UPLOADED: { dot: "bg-purple-500", text: "text-purple-600" },
  };
  return configs[status] || configs.UPLOADED;
};

const getTeacherBadgeColor = (status: TeacherStatus) => {
  switch (status) {
    case "PUBLISHED":
    case "ACCEPTED":
      return "bg-emerald-500/10 text-emerald-500"
    case "UPDATE":
      return "bg-amber-500/10 text-amber-500"
    case "REJECTED":
      return "bg-red-500/10 text-red-500"
    default:
      return "bg-purple-500/10 text-purple-500"
  }
}


// --- Actions Component ---
interface ChapterActionsProps {
  chapter: BookChapter;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
  onTeacherStatusChange?: (id: string, status: TeacherStatus) => void;
  session?: any;
}

const ChapterActions = ({
  chapter,
  onDelete,
  onEdit,
  onView,
  onTeacherStatusChange,
  session,
}: ChapterActionsProps) => {
  const isStudent = session?.user?.role === "STUDENT";
  const isFaculty = session?.user?.role === "FACULTY";
  const isAdmin = session?.user?.role === "ADMIN";

  // Lock edit buttons when published, accepted or rejected
  const isEditable = !isStudent || (
    chapter.bookChapterStatus !== "PUBLISHED" &&
    chapter.teacherStatus !== "ACCEPTED" &&
    chapter.teacherStatus !== "REJECTED" &&
    chapter.teacherStatus !== "PUBLISHED"
  );

  return (
    <div className="flex items-center gap-2">
      {/* Faculty Actions: Review Verification Dropdown */}
      {isFaculty && chapter.teacherStatus !== "PUBLISHED" && (
        <Select
          defaultValue={chapter.teacherStatus}
          onValueChange={(val) => onTeacherStatusChange?.(chapter.id, val as TeacherStatus)}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs border-dashed">
            <SelectValue placeholder="Verify status" />
          </SelectTrigger>
          <SelectContent>
            {["ACCEPTED", "UPDATE", "REJECTED"].map((status) => {
              const config = getTeacherStatusConfig(status as TeacherStatus);
              return (
                <SelectItem key={status} value={status}>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                    <span className="text-xs">{status}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      )}

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
          {isEditable && (
            <DropdownMenuItem onClick={() => onEdit?.(chapter.id)}>
              <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
              Edit chapter
            </DropdownMenuItem>
          )}
          
          {(!isStudent || chapter.bookChapterStatus === "SUBMITTED") && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={() => onDelete(chapter.id)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// --- Table Columns ---

interface ColumnProps {
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
  onTeacherStatusChange?: (id: string, status: TeacherStatus) => void;
  session?: any;
}

export const createColumns = ({
  onDelete,
  onEdit,
  onView,
  onTeacherStatusChange,
  session,
}: ColumnProps): ColumnDef<BookChapter>[] => [
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
            {row.original.abstract?.length ? row.original.abstract.slice(0, 60) + "..." : "No abstract"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "bookChapterStatus",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("bookChapterStatus") as BookchapterStatus;
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
  },
  {
    accessorKey: "teacherStatus",
    header: "Reviewer Status",
    cell: ({ row }) => {
      const status = row.getValue("teacherStatus") as TeacherStatus;
      const config = getTeacherStatusConfig(status);
      return (
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${config.dot}`} />
          <span className={`text-xs font-semibold ${config.text}`}>{status}</span>
        </div>
      );
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
        id: index,
      }));
      return (
        <div className="flex items-center gap-2">
          <AnimatedAvatarGroupTooltip items={authors} maxCount={3} />
        </div>
      );
    },
  },
  {
    accessorKey: "publisher",
    header: "Publisher",
    cell: ({ row }) => <span className="text-xs">{row.original.publisher || "—"}</span>,
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return <span className="text-xs text-muted-foreground">{date.toLocaleDateString()}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ChapterActions
        chapter={row.original}
        onDelete={onDelete}
        onEdit={onEdit}
        onView={onView}
        onTeacherStatusChange={onTeacherStatusChange}
        session={session}
      />
    ),
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
  onRefresh,
}: BookChapterTableProps) {
  const { data: session } = useSession();
  const [data, setData] = React.useState<BookChapter[]>(initialData);
  const [totalRecords, setTotalRecords] = React.useState(initialTotal);
  const [isLoading, setIsLoading] = React.useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [viewMode, setViewMode] = React.useState<"table" | "card">("table");
  const [searchTerm, setSearchTerm] = React.useState("");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingChapterId, setViewingChapterId] = useState<string | null>(null);

  // Update Comment dialog states
  const [updateCommentDialogOpen, setUpdateCommentDialogOpen] = useState(false);
  const [updateComment, setUpdateComment] = useState("");
  const [targetChapterId, setTargetChapterId] = useState<string | null>(null);

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
          description: response.error,
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

  const handleTeacherStatusChange = async (id: string, status: TeacherStatus) => {
    if (status === "UPDATE") {
      setTargetChapterId(id);
      setUpdateComment("");
      setUpdateCommentDialogOpen(true);
      return;
    }

    const toastId = toast.loading("Updating review status...");
    try {
      const response = await updateBookChapterReviewStatus(id, status);
      if (response.data) {
        toast.success(`Verification status updated to ${status.toLowerCase()}`, { id: toastId });
        fetchData();
        onRefresh?.();
      } else if (response.error) {
        toast.error("Failed to update status", { id: toastId, description: response.error });
      }
    } catch {
      toast.error("Failed to update status", { id: toastId });
    }
  };

  const handleConfirmUpdateComment = async () => {
    if (!updateComment.trim()) {
      toast.error("Please enter a feedback comment for student revision.");
      return;
    }

    setUpdateCommentDialogOpen(false);
    const toastId = toast.loading("Submitting revision request...");
    try {
      if (targetChapterId) {
        const response = await updateBookChapterReviewStatus(targetChapterId, "UPDATE", updateComment);
        if (response.data) {
          toast.success("Revision request submitted successfully", { id: toastId });
          setTargetChapterId(null);
          setUpdateComment("");
          fetchData();
          onRefresh?.();
        } else if (response.error) {
          toast.error("Failed to submit request", { id: toastId, description: response.error });
        }
      }
    } catch {
      toast.error("An error occurred", { id: toastId });
    }
  };

  // Filter management functions
  const updateFilter = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === "page" || key === "limit" ? value : 1,
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
          description: response.error,
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
          description: response.error,
        });
      }
    } catch (error) {
      console.error("Error bulk deleting book chapters:", error);
      toast.error("Failed to delete book chapters");
    }
  };

  // Create columns with handlers
  const columns = React.useMemo(
    () =>
      createColumns({
        onDelete: handleDelete,
        onEdit: (id) => {
          setEditingChapterId(id);
          setEditDialogOpen(true);
        },
        onView: (id) => {
          setViewingChapterId(id);
          setViewDialogOpen(true);
        },
        onTeacherStatusChange: handleTeacherStatusChange,
        session,
      }),
    [session],
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
    <>
      <Card className="w-full p-3! border-dashed border-2 border-chart-2 gap-3! ">
        {/* Header Section */}
        <CardHeader className="space-y-4 border-b p-0!">
          <div className="flex flex-col gap-4 sm:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <BookOpen className="h-6 w-6 text-chart-2" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Book Chapters
                </h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(rowSelection).length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="shadow-lg animate-bounce"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Selected ({Object.keys(rowSelection).length})
                </Button>
              )}
              <ExportDialog
                triggerButton={
                  <Button
                    variant="secondary"
                    size="sm"
                    className="shadow-lg dark:bg-white/20 bg-[#eff5eb] hover:bg-white/30 dark:text-white text-black border-white/30"
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                }
              />
              <BookChapterAddForm
                onSuccess={fetchData}
                onClose={() => fetchData()}
              />
            </div>
          </div>
        </CardHeader>

        {/* Toolbar */}
        <CardContent className="rounded-lg border bg-card p-4 shadow-sm flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
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
                  className="h-9 gap-2 border-dashed bg-muted/40 hover:bg-muted"
                >
                  <ChevronDown className="h-4 w-4" />
                  <span className="whitespace-nowrap">
                    Status {filters.bookChapterStatus && `(${filters.bookChapterStatus})`}
                  </span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => {
                    const { bookChapterStatus, ...rest } = filters;
                    setFilters({ ...rest, page: 1 });
                  }}
                >
                  All Statuses
                </DropdownMenuItem>

                {["SUBMITTED", "UNDER_REVIEW", "APPROVED", "PUBLISHED"].map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => setFilters(prev => ({ ...prev, bookChapterStatus: status as BookchapterStatus, page: 1 }))}
                    className="flex items-center gap-2"
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${getStatusConfig(status as BookchapterStatus).dot}`}
                    />
                    <span className="capitalize text-sm font-medium">
                      {status.replace(/_/g, " ").toLowerCase()}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

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
                className={`h-7 w-7 ${viewMode === "table" ? "bg-muted shadow-sm" : "hover:bg-transparent"}`}
              >
                <List className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("card")}
                className={`h-7 w-7 ${viewMode === "card" ? "bg-muted shadow-sm" : "hover:bg-transparent"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>

        {/* Content Area */}
        <CardContent className="h-fit p-0!">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <span className="h-8 w-8 rounded-full border-4 border-t-purple-600 animate-spin" />
              <div className="text-muted-foreground text-xs font-semibold">Updating Table Grid...</div>
            </div>
          ) : viewMode === "table" ? (
            <div className="rounded-md border bg-card shadow-sm overflow-hidden">
              {/* Internal Table Scrolling */}
              <div className="max-h-[600px] overflow-y-auto scrollbar-gradient">
                <Table className="relative">
                  <TableHeader className="bg-muted/50 sticky top-0 z-10">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} className="h-10 text-xs font-bold text-foreground">
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                          className="hover:bg-muted/30 transition-colors"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="py-2.5 text-xs">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                          No results found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
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
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-muted p-5 shadow-sm transition-all hover:shadow-2xl hover:scale-102 duration-300"
                  >
                    <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                      <ChapterActions
                        chapter={chapter}
                        onDelete={handleDelete}
                        onEdit={(id) => {
                          setEditingChapterId(id);
                          setEditDialogOpen(true);
                        }}
                        onView={(id) => {
                          setViewingChapterId(id);
                          setViewDialogOpen(true);
                        }}
                        onTeacherStatusChange={handleTeacherStatusChange}
                        session={session}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`font-semibold border text-[10px] ${getStatusConfig(chapter.bookChapterStatus).bg} ${getStatusConfig(chapter.bookChapterStatus).text}`}
                        >
                          {chapter.bookChapterStatus.replace(/_/g, " ")}
                        </Badge>
                        <Badge variant="secondary" className={`${getTeacherBadgeColor(chapter.teacherStatus)} text-[10px]`}>
                          {chapter.teacherStatus}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <h3 className="line-clamp-2 font-bold text-sm leading-tight text-foreground">
                          {chapter.title}
                        </h3>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {chapter.abstract || "No abstract provided."}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          <span>{students.length + teachers.length} Authors</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {new Date(chapter.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t pt-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                          Reg Fees
                        </span>
                        <span className="font-mono text-xs font-semibold">
                          {chapter.registrationFees ? `₹${chapter.registrationFees.toLocaleString()}` : "Free"}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setViewingChapterId(chapter.id);
                          setViewDialogOpen(true);
                        }}
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

        {/* Pagination Footer */}
        <CardFooter className="flex flex-col-reverse items-center justify-between gap-4 border-t pt-4 sm:flex-row">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span>
              {Object.keys(rowSelection).length} of {data.length} row(s) selected
            </span>
            <span>
              (Showing {(currentPage - 1) * (filters.limit || 10) + 1} to{" "}
              {Math.min(currentPage * (filters.limit || 10), totalRecords)} of{" "}
              {totalRecords})
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-muted-foreground hidden sm:block">
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
                <ChevronDown className="h-4 w-4 rotate-90 " />
              </Button>
              <span className="text-xs font-semibold text-muted-foreground">
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

      {/* Revision Request Comments dialog */}
      <Dialog open={updateCommentDialogOpen} onOpenChange={setUpdateCommentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold text-lg text-amber-600">
              <MessageSquare className="h-5 w-5" />
              Correction Details Required
            </DialogTitle>
            <DialogDescription className="text-sm">
              Please provide clear revision feedback explaining to the student co-author what updates are required.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="e.g. Please update the ISBN number to the publisher registered copy and attach the validated manuscript document PDF..."
              value={updateComment}
              onChange={(e) => setUpdateComment(e.target.value)}
              className="min-h-[120px] text-sm"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUpdateCommentDialogOpen(false)
                setTargetChapterId(null)
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
              onClick={handleConfirmUpdateComment}
            >
              Request Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editingChapterId && (
        <EditBookChapterDialog
          bookChapterId={editingChapterId}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setEditingChapterId(null);
          }}
          onSuccess={() => {
            fetchData();
            onRefresh?.();
          }}
        />
      )}
      {viewingChapterId && (
        <BookChapterViewDialog
          chapterId={viewingChapterId}
          open={viewDialogOpen}
          setOpen={setViewDialogOpen}
          setViewingChapterId={setViewingChapterId}
        />
      )}
    </>
  );
}
