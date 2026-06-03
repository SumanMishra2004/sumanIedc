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
  Lightbulb,
  Users,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Plus,
  Loader2
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { FilterDialog } from "./patentFilterDialog";
import { ExportDialog } from "./patentExportDialog";
import { Patent, PatentFilters } from "@/types/patent";
import PatentAddForm from "./patentAddForm";
import { PatentStatus, TeacherStatus } from "@prisma/client";
import { toast } from "sonner";
import {
  getPatents,
  deletePatent,
  bulkDeletePatents,
  updatePatent,
} from "@/lib/research/patentApi";
import {
  Card,
  CardContent,
  CardHeader,
} from "../ui/card";
import { AnimatedAvatarGroupTooltip } from "../ui/animated-tooltip";
import EditPatentDialog from "./patentEditForm";
import { PatentViewDialog } from "./viewDialog";
import { cn } from "@/lib/utils";

// Status configuration
const getStatusConfig = (status: PatentStatus) => {
  const configs = {
    GRANTED: {
      bg: "bg-purple-50 dark:bg-purple-950/30",
      text: "text-purple-700 dark:text-purple-400",
      border: "border-purple-200 dark:border-purple-800",
      dot: "bg-purple-500",
    },
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
    REJECTED: {
      bg: "bg-red-50 dark:bg-red-950/30",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-200 dark:border-red-800",
      dot: "bg-red-500",
    },
  };
  return configs[status] || configs.SUBMITTED;
};

const getTeacherStatusConfig = (status: TeacherStatus) => {
  const configs = {
    PUBLISHED: { dot: "bg-purple-500", text: "text-purple-600" },
    ACCEPTED: { dot: "bg-emerald-500", text: "text-emerald-600" },
    UPDATE: { dot: "bg-amber-500", text: "text-amber-600" },
    REJECTED: { dot: "bg-red-500", text: "text-red-600" },
    UPLOADED: { dot: "bg-blue-500", text: "text-blue-600" },
  };
  return configs[status] || configs.UPLOADED;
};

// Actions Component
interface PatentActionsProps {
  patent: Patent;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onTeacherStatusChange?: (id: string, status: TeacherStatus) => void;
  session?: any;
}

const PatentActions = ({
  patent,
  onDelete,
  onEdit,
  onView,
  onTeacherStatusChange,
  session
}: PatentActionsProps) => {
  const isStudent = session?.user?.role === "STUDENT";
  const isFaculty = session?.user?.role === "FACULTY";
  const isAdmin = session?.user?.role === "ADMIN";

  // Lock edit buttons when published, accepted or rejected
  const isEditable = !isStudent || (
    patent.patentStatus !== "GRANTED" &&
    patent.teacherStatus !== "ACCEPTED" &&
    patent.teacherStatus !== "REJECTED" &&
    patent.teacherStatus !== "PUBLISHED"
  );

  return (
    <div className="flex items-center gap-2">
      {/* Faculty Actions: Review Verification Dropdown */}
      {isFaculty && patent.teacherStatus !== "PUBLISHED" && (
        <Select
          defaultValue={patent.teacherStatus}
          onValueChange={(val) => onTeacherStatusChange?.(patent.id, val as TeacherStatus)}
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
          <DropdownMenuItem onClick={() => onView(patent.id)}>
            <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
            View Details
          </DropdownMenuItem>
          {isEditable && (
            <DropdownMenuItem onClick={() => onEdit(patent.id)}>
              <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
              Edit Patent
            </DropdownMenuItem>
          )}
          {(!isStudent || patent.patentStatus === "SUBMITTED") && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(patent.id)}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
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

// Column definitions function
const createColumns = ({
  onDelete,
  onEdit,
  onView,
  onTeacherStatusChange,
  session
}: {
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onTeacherStatusChange?: (id: string, status: TeacherStatus) => void;
  session?: any;
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
            {title}
          </span>
          <span className="text-xs text-muted-foreground truncate max-w-60 mt-0.5">
            {row.original.grantedPatentNo || row.original.applicationNo || "No registration number"}
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
  },
  {
    accessorKey: "teacherStatus",
    header: "Review Status",
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
    accessorKey: "filingDate",
    header: "Filing Date",
    cell: ({ row }) => {
      const date = row.original.filingDate;
      return date ? (
        <span className="text-xs text-muted-foreground">
          {new Date(date).toLocaleDateString()}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <PatentActions
        patent={row.original}
        onDelete={onDelete}
        onEdit={onEdit}
        onView={onView}
        onTeacherStatusChange={onTeacherStatusChange}
        session={session}
      />
    ),
  },
];

export default function PatentTable({ onRefresh }: { onRefresh?: () => void }) {
  const { data: session } = useSession();
  const [data, setData] = useState<Patent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [searchTerm, setSearchTerm] = useState("");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPatentId, setEditingPatentId] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingPatentId, setViewingPatentId] = useState<string | null>(null);

  // Update Comment dialog states
  const [updateCommentDialogOpen, setUpdateCommentDialogOpen] = useState(false);
  const [updateComment, setUpdateComment] = useState("");
  const [targetPatentId, setTargetPatentId] = useState<string | null>(null);

  const [filters, setFilters] = useState<PatentFilters>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getPatents(filters);
      if (response.data) {
        setData(response.data.patents);
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

  const handleTeacherStatusChange = async (id: string, status: TeacherStatus) => {
    if (status === "UPDATE") {
      setTargetPatentId(id);
      setUpdateComment("");
      setUpdateCommentDialogOpen(true);
      return;
    }

    const toastId = toast.loading("Updating review status...");
    try {
      const response = await updatePatent(id, { teacherStatus: status });
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
      if (targetPatentId) {
        const response = await updatePatent(targetPatentId, {
          teacherStatus: "UPDATE",
          updateComment: updateComment,
        });
        if (response.data) {
          toast.success("Revision request submitted successfully", { id: toastId });
          setTargetPatentId(null);
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

  const handleDelete = useCallback(async (id: string) => {
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
      toast.error("Failed to delete patent");
    }
  }, [fetchData, onRefresh]);

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection);
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} patent(s)?`)) return;
    try {
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
    } catch {
      toast.error("An error occurred during bulk delete");
    }
  };

  const columns = useMemo(
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
        onTeacherStatusChange: handleTeacherStatusChange,
        session
      }),
    [handleDelete, session]
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
      <div className="w-full space-y-4">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Patents</h2>
              <p className="text-sm text-muted-foreground">
                Manage registered faculty and student patents
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

            <PatentAddForm
              onSuccess={fetchData}
              onClose={() => fetchData()}
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl bg-card border shadow-xs">
          <div className="flex flex-1 items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patent title..."
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
              onValueChange={(value) => updateFilter("limit", parseInt(value))}
            >
              <SelectTrigger className="h-10 w-[120px] rounded-lg">
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
              <p className="text-sm text-muted-foreground">Loading patents data…</p>
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
                            : flexRender(header.column.columnDef.header, header.getContext())}
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
                        className="hover:bg-muted/10 transition-colors"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                        No patent results found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/10">
              <span className="text-sm text-muted-foreground">
                Showing {data.length} of {totalRecords} records
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter("page", (filters.page || 1) - 1)}
                  disabled={filters.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter("page", (filters.page || 1) + 1)}
                  disabled={(filters.page || 1) * (filters.limit || 10) >= totalRecords}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Grid Card View Mode */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.map((patent) => {
              const statusConfig = getStatusConfig(patent.patentStatus);
              const teacherConfig = getTeacherStatusConfig(patent.teacherStatus);
              const students = patent.studentAuthors || [];
              const teachers = patent.facultyAuthors || [];
              const authors = [...students, ...teachers].map((author, index) => ({
                name: author.user.name || "Unknown",
                email: author.user.email || "No email",
                image: author.user.image || undefined,
                id: index
              }));

              return (
                <div
                  key={patent.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card p-5 shadow-xs hover:shadow-lg transition-all hover:border-primary/20 duration-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] font-medium px-2 py-0.5", statusConfig.bg, statusConfig.text, statusConfig.border)}
                        >
                          {patent.patentStatus}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <span className={cn("h-1.5 w-1.5 rounded-full", teacherConfig.dot)} />
                          <span className="text-[10px] font-semibold text-muted-foreground">{patent.teacherStatus}</span>
                        </div>
                      </div>
                      <h3
                        onClick={() => {
                          setViewingPatentId(patent.id);
                          setViewDialogOpen(true);
                        }}
                        className="font-semibold text-base tracking-tight leading-tight line-clamp-2 hover:text-primary cursor-pointer transition-colors mt-2"
                      >
                        {patent.title}
                      </h3>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
                        onTeacherStatusChange={handleTeacherStatusChange}
                        session={session}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                    {patent.abstract || "No abstract provided."}
                  </p>

                  <div className="space-y-3.5 mt-4">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t pt-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 opacity-60" />
                        <span>{patent.filingDate ? new Date(patent.filingDate).toLocaleDateString() : "—"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 opacity-60" />
                        <AnimatedAvatarGroupTooltip items={authors} maxCount={3} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Revision request comment Dialog */}
      <Dialog open={updateCommentDialogOpen} onOpenChange={setUpdateCommentDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-500" />
              Request Revisions
            </DialogTitle>
            <DialogDescription>
              Provide dynamic comments and instructions to guide the author on what changes are required.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2.5">
            <Textarea
              placeholder="e.g. Please update the application number and upload the official receipt document from the registry..."
              className="min-h-24 resize-none rounded-lg text-sm border-border focus-visible:ring-amber-400"
              value={updateComment}
              onChange={(e) => setUpdateComment(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUpdateCommentDialogOpen(false);
                setTargetPatentId(null);
                setUpdateComment("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
              onClick={handleConfirmUpdateComment}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog Modal */}
      {editingPatentId && (
        <EditPatentDialog
          patentId={editingPatentId}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={fetchData}
        />
      )}

      {/* View Dialog Modal */}
      {viewingPatentId && (
        <PatentViewDialog
          patentId={viewingPatentId}
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
        />
      )}
    </>
  );
}
