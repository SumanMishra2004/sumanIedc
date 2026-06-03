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
  Award,
  Calendar,
  Building,
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

import { FilterDialog } from "./certificateFilterDialog";
import { ExportDialog } from "./certificateExportDialog";
import { Certificate, CertificateFilters } from "@/types/certificate";
import CertificateAddForm from "./certificateAddForm";
import CertificateEditForm from "./certificateEditForm";
import { CertificateViewDialog } from "./viewDialog";
import { CertificateStatus } from "@prisma/client";
import { toast } from "sonner";
import {
  getCertificates,
  deleteCertificate,
  bulkDeleteCertificates,
} from "@/lib/research/certificateApi";
import { cn } from "@/lib/utils";

// Status configuration
const getStatusConfig = (status: CertificateStatus) => {
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

// Actions Component
interface CertificateActionsProps {
  certificate: Certificate;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  session?: any;
}

const CertificateActions = ({
  certificate,
  onDelete,
  onEdit,
  onView,
  session
}: CertificateActionsProps) => {
  const isStudent = session?.user?.role === "STUDENT";

  // Lock edit buttons when approved
  const isEditable = !isStudent || certificate.certificateStatus !== "APPROVED";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onView(certificate.id)}>
          <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
          View Details
        </DropdownMenuItem>
        {isEditable && (
          <DropdownMenuItem onClick={() => onEdit(certificate.id)}>
            <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
            Edit details
          </DropdownMenuItem>
        )}
        {(!isStudent || certificate.certificateStatus === "SUBMITTED") && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(certificate.id)}
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

// Column definitions function
const createColumns = ({
  onDelete,
  onEdit,
  onView,
  session
}: {
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  session?: any;
}): ColumnDef<Certificate>[] => [
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
            {row.original.description || "No description provided"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "offeredBy",
    header: "Offered By",
    cell: ({ row }) => <span className="text-sm font-medium">{row.original.offeredBy}</span>,
  },
  {
    accessorKey: "certificateStatus",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("certificateStatus") as CertificateStatus;
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
    accessorKey: "dateOfCompletion",
    header: "Completion Date",
    cell: ({ row }) => {
      const date = row.original.dateOfCompletion;
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
      <CertificateActions
        certificate={row.original}
        onDelete={onDelete}
        onEdit={onEdit}
        onView={onView}
        session={session}
      />
    ),
  },
];

export default function CertificateTable({ onRefresh }: { onRefresh?: () => void }) {
  const { data: session } = useSession();
  const [data, setData] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [searchTerm, setSearchTerm] = useState("");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const [filters, setFilters] = useState<CertificateFilters>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getCertificates(filters);
      if (response.data) {
        setData(response.data.certificates);
        setTotalRecords(response.data.pagination.total);
      } else if (response.error) {
        toast.error("Failed to load certificates", {
          description: response.error,
        });
      }
    } catch (error) {
      console.error("Error fetching certificates:", error);
      toast.error("Failed to load certificates");
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

  const updateFilter = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === "page" || key === "limit" ? value : 1,
    }));
  };

  const updateFilters = (newFilters: Partial<CertificateFilters>) => {
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
    if (!confirm("Are you sure you want to delete this certificate?")) return;
    try {
      const response = await deleteCertificate(id);
      if (response.data) {
        toast.success("Certificate deleted successfully");
        fetchData();
        onRefresh?.();
      } else if (response.error) {
        toast.error("Failed to delete certificate", {
          description: response.error,
        });
      }
    } catch (error) {
      toast.error("Failed to delete certificate");
    }
  }, [fetchData, onRefresh]);

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection);
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} certificate(s)?`)) return;
    try {
      const response = await bulkDeleteCertificates(selectedIds);
      if (response.data) {
        toast.success(`${response.data.count} certificates deleted successfully`);
        setRowSelection({});
        fetchData();
        onRefresh?.();
      } else if (response.error) {
        toast.error("Failed to delete certificates", {
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
          const cert = data.find(c => c.id === id);
          if (cert) setSelectedCertificate(cert);
          setEditDialogOpen(true);
        },
        onView: (id) => {
          const cert = data.find(c => c.id === id);
          if (cert) setSelectedCertificate(cert);
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
    if (filters.certificateStatus) count++;
    if (filters.isPublic !== undefined) count++;
    if (filters.dateOfCompletionFrom || filters.dateOfCompletionTo) count++;
    if (filters.offeredBy) count++;
    return count;
  }, [filters]);

  return (
    <>
      <div className="w-full space-y-4">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Certificates</h2>
              <p className="text-sm text-muted-foreground">
                Manage your credentials, courses, and certifications
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

            <CertificateAddForm
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
                placeholder="Search certificate title..."
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
              <p className="text-sm text-muted-foreground">Loading certificates data…</p>
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
                        No certificates found.
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
            {data.map((certificate) => {
              const statusConfig = getStatusConfig(certificate.certificateStatus);
              return (
                <div
                  key={certificate.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card p-5 shadow-xs hover:shadow-lg transition-all hover:border-primary/20 duration-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] font-medium px-2 py-0.5", statusConfig.bg, statusConfig.text, statusConfig.border)}
                        >
                          {certificate.certificateStatus}
                        </Badge>
                        <Badge variant={certificate.isPublic ? "outline" : "secondary"} className="text-[10px]">
                          {certificate.isPublic ? "Public" : "Private"}
                        </Badge>
                      </div>
                      <h3
                        onClick={() => {
                          setSelectedCertificate(certificate);
                          setViewDialogOpen(true);
                        }}
                        className="font-semibold text-base tracking-tight leading-tight line-clamp-2 hover:text-primary cursor-pointer transition-colors mt-2"
                      >
                        {certificate.title}
                      </h3>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <CertificateActions
                        certificate={certificate}
                        onDelete={handleDelete}
                        onEdit={(id) => {
                          setSelectedCertificate(certificate);
                          setEditDialogOpen(true);
                        }}
                        onView={(id) => {
                          setSelectedCertificate(certificate);
                          setViewDialogOpen(true);
                        }}
                        session={session}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                    {certificate.description || "No description provided."}
                  </p>

                  <div className="space-y-3.5 mt-4">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t pt-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 opacity-60" />
                        <span>{certificate.dateOfCompletion ? new Date(certificate.dateOfCompletion).toLocaleDateString() : "—"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <Building className="w-3.5 h-3.5 opacity-60 mr-1" />
                        <span className="truncate max-w-[100px]">{certificate.offeredBy}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Dialog Modal */}
      {selectedCertificate && (
        <CertificateEditForm
          certificateId={selectedCertificate.id}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setSelectedCertificate(null);
          }}
          onSuccess={fetchData}
        />
      )}

      {/* View Dialog Modal */}
      {selectedCertificate && (
        <CertificateViewDialog
          certificate={selectedCertificate}
          open={viewDialogOpen}
          onOpenChange={(open) => {
            setViewDialogOpen(open);
            if (!open) setSelectedCertificate(null);
          }}
        />
      )}
    </>
  );
}
