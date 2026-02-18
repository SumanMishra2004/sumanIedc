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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
  const [totalRecords, setTotalRecords] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  
  // View Mode
  const [viewMode, setViewMode] = React.useState<"table" | "card">("table");

  // Pagination & Sorting state
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Filters state
  const [filters, setFilters] = React.useState<CertificateFilters>({
    page: 1,
    limit: 10,
  });

  // Search state
  const [searchTerm, setSearchTerm] = React.useState("");

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [selectedCertificate, setSelectedCertificate] = React.useState<Certificate | null>(null);

  // Fetch data
  const fetchData = React.useCallback(async () => {
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

  // Initial fetch and on filters change
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
        if (searchTerm !== (filters.search || "")) {
             setFilters((prev) => ({ ...prev, search: searchTerm, page: 1 }));
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, filters.search]);

  // Filter helpers
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
      limit: 10,
    });
    setSearchTerm("");
  };

  // Actions
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this certificate?")) return;

    try {
      const response = await deleteCertificate(id);
      if (response.data) {
        toast.success("Certificate deleted successfully");
        fetchData();
        setRowSelection({});
      } else if (response.error) {
        toast.error("Failed to delete certificate", { description: response.error });
      }
    } catch (error) {
       console.error("Error deleting certificate:", error);
       toast.error("Failed to delete certificate");
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) {
      toast.error("Please select certificates to delete");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.length} certificate(s)?`)) return;

    try {
      await Promise.all(selectedIds.map((id) => deleteCertificate(id)));
      toast.success("Certificates deleted successfully");
      setRowSelection({});
      fetchData();
    } catch (error) {
        console.error("Error bulk deleting:", error);
        toast.error("Failed to delete some certificates");
    }
  };

  const handlePageChange = (newPage: number) => {
      updateFilters({ page: newPage });
  };

  const handlePageSizeChange = (newSize: number) => {
      setFilters((prev) => ({ ...prev, limit: newSize, page: 1 }));
  };

  // Columns
  const columns: ColumnDef<Certificate>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="lowercase font-medium">{row.getValue("title")}</div>,
    },
    {
      accessorKey: "offeredBy",
      header: "Offered By",
      cell: ({ row }) => <div>{row.getValue("offeredBy") || "N/A"}</div>,
    },
    {
      accessorKey: "user.name",
      header: "User",
      cell: ({ row }) => <div className="truncate">{row.original.user?.name || "N/A"}</div>,
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
      accessorKey: "dateOfCompletion",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue("dateOfCompletion");
        return <div>{date ? new Date(date as string).toLocaleDateString() : "N/A"}</div>;
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
      pagination: {
        pageIndex: (filters.page || 1) - 1,
        pageSize: filters.limit || 10,
      },
    },
    manualPagination: true,
    pageCount: Math.ceil(totalRecords / (filters.limit || 10)),
  });

  const currentPage = filters.page || 1;
  const totalPages = Math.ceil(totalRecords / (filters.limit || 10));

  return (
    <>
      <Card className="w-full p-3! border-dashed border-2 border-chart-2 gap-3!">
        {/* Header Section */}
        <CardHeader className="space-y-4 border-b p-0!">
          <div className="flex flex-col gap-4 sm:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <BookOpen className="h-6 w-6 text-chart-2" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Certificates
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
              <CertificateAddForm 
                 onSuccess={fetchData} 
                 trigger={
                   <Button>
                     <Plus className="mr-2 h-4 w-4" /> Add Certificate
                   </Button>
                 }
              />
            </div>
          </div>
        </CardHeader>

        {/* Toolbar */}
        <CardContent className="rounded-lg border bg-card p-4 shadow-sm flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
            {/* Search */}
            <div className="relative w-full lg:w-78">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search certificates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
                className="h-9 pl-9 bg-background"
              />
            </div>
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
                className={`h-7 w-7 ${
                  viewMode === "table" ? "bg-muted shadow-sm" : "hover:bg-transparent"
                }`}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("card")}
                className={`h-7 w-7 ${
                  viewMode === "card" ? "bg-muted shadow-sm" : "hover:bg-transparent"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>

            {/* Columns */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex h-9 gap-2 bg-muted/40 hover:bg-muted">
                  Columns <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table.getAllColumns().filter((column) => column.getCanHide()).map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
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
                     <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                       {headerGroup.headers.map((header) => (
                         <TableHead key={header.id} className="h-10">
                           {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                         </TableHead>
                       ))}
                     </TableRow>
                   ))}
                 </TableHeader>
                 <TableBody>
                   {table.getRowModel().rows?.length ? (
                     table.getRowModel().rows.map((row) => (
                       <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="cursor-pointer hover:bg-muted/30">
                         {row.getVisibleCells().map((cell) => (
                           <TableCell key={cell.id} className="py-3">
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
          ) : (
             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
               {table.getRowModel().rows.map((row) => {
                 const cert = row.original;
                 return (
                   <div key={row.id} className="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-muted p-5 shadow-sm transition-all hover:shadow-2xl hover:border-primary/20 hover:scale-105 duration-400">
                     <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100 z-10">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 bg-white/50 backdrop-blur-sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedCertificate(cert); setViewDialogOpen(true); }}>
                                <Eye className="mr-2 h-4 w-4" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedCertificate(cert); setEditDialogOpen(true); }}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(cert.id)}>
                                <Trash className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                     </div>
                     <div className="space-y-4">
                        <div className="flex items-start justify-between">
                             <Badge variant="outline" className="font-medium">
                                {cert.offeredBy || "Unknown Issuer"}
                             </Badge>
                             <Badge variant={cert.isPublic ? "outline" : "secondary"}>
                                {cert.isPublic ? "Public" : "Private"}
                             </Badge>
                        </div>
                        <div className="space-y-1">
                             <h3 className="line-clamp-2 font-semibold leading-tight text-foreground">{cert.title}</h3>
                             <p className="line-clamp-2 text-sm text-muted-foreground">{cert.description || "No description provided."}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                             <Calendar className="h-3.5 w-3.5" />
                             <span>{new Date(cert.dateOfCompletion).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                             <Building className="h-3.5 w-3.5" />
                             <span>{cert.user?.name || "Unknown User"}</span>
                        </div>
                     </div>
                     <div className="mt-4 flex items-center justify-between border-t pt-4">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs bg-accent hover:bg-accent/80 ml-auto"
                            onClick={() => { setSelectedCertificate(cert); setViewDialogOpen(true); }}
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
                <span>{Object.keys(rowSelection).length} of {totalRecords} row(s) selected</span>
                <span className="text-xs">
                    (Showing {(currentPage - 1) * (filters.limit || 10) + 1} to {Math.min(currentPage * (filters.limit || 10), totalRecords)} of {totalRecords})
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
                        <SelectTrigger className="h-8 w-16 bg-accent text-black">
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
                         <ChevronDown className="h-4 w-4 rotate-90" />
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
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
    </>
  );
}
