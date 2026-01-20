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

// --- Types & Data ---

type PublicationStatus = "DRAFT" | "SUBMITTED" | "PUBLISHED" | "REJECTED";

type BookChapter = {
  id: string;
  title: string;
  abstract: string | null;
  imageUrl: string | null;
  documentUrl: string | null;
  status: PublicationStatus;
  isbnIssn: string | null;
  registrationFees: number | null;
  reimbursement: number | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  studentAuthors: Array<{ id: string; name: string; orderIndex: number }>;
  teacherAuthors: Array<{ id: string; name: string; orderIndex: number }>;
};

const data: BookChapter[] = [
  {
    id: "ch1",
    title: "Introduction to Machine Learning",
    abstract: "A comprehensive guide to ML fundamentals and core concepts.",
    imageUrl: null,
    documentUrl: "/docs/ml-intro.pdf",
    status: "PUBLISHED",
    isbnIssn: "978-3-16-148410-0",
    registrationFees: 150.0,
    reimbursement: 100,
    isPublic: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-03-20"),
    studentAuthors: [
      { id: "s1", name: "Alice Johnson", orderIndex: 0 },
      { id: "s2", name: "Bob Smith", orderIndex: 1 },
    ],
    teacherAuthors: [{ id: "t1", name: "Dr. Sarah Wilson", orderIndex: 0 }],
  },
  {
    id: "ch2",
    title: "Advanced Neural Networks",
    abstract: "Deep dive into neural network architectures.",
    imageUrl: null,
    documentUrl: null,
    status: "SUBMITTED",
    isbnIssn: "978-3-16-148411-7",
    registrationFees: 200.0,
    reimbursement: 150,
    isPublic: false,
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-04-15"),
    studentAuthors: [{ id: "s3", name: "Charlie Brown", orderIndex: 0 }],
    teacherAuthors: [{ id: "t2", name: "Prof. Michael Chen", orderIndex: 0 }],
  },
  {
    id: "ch3",
    title: "Quantum Computing Basics",
    abstract: null,
    imageUrl: null,
    documentUrl: null,
    status: "DRAFT",
    isbnIssn: null,
    registrationFees: null,
    reimbursement: null,
    isPublic: false,
    createdAt: new Date("2024-03-05"),
    updatedAt: new Date("2024-03-10"),
    studentAuthors: [
      { id: "s4", name: "Diana Prince", orderIndex: 0 },
      { id: "s5", name: "Ethan Hunt", orderIndex: 1 },
    ],
    teacherAuthors: [{ id: "t3", name: "Dr. Lisa Anderson", orderIndex: 0 }],
  },
  {
    id: "ch4",
    title: "Data Structures and Algorithms",
    abstract: "Essential algorithms for competitive programming.",
    imageUrl: null,
    documentUrl: "/docs/dsa.pdf",
    status: "PUBLISHED",
    isbnIssn: "978-3-16-148412-4",
    registrationFees: 120.0,
    reimbursement: 80,
    isPublic: true,
    createdAt: new Date("2023-11-20"),
    updatedAt: new Date("2024-01-25"),
    studentAuthors: [{ id: "s6", name: "Frank Miller", orderIndex: 0 }],
    teacherAuthors: [{ id: "t4", name: "Prof. Robert Taylor", orderIndex: 0 }],
  },
  {
    id: "ch5",
    title: "Blockchain Technology",
    abstract: "Understanding distributed ledger technology.",
    imageUrl: null,
    documentUrl: null,
    status: "REJECTED",
    isbnIssn: "978-3-16-148413-1",
    registrationFees: 180.0,
    reimbursement: 0,
    isPublic: false,
    createdAt: new Date("2024-01-30"),
    updatedAt: new Date("2024-02-28"),
    studentAuthors: [{ id: "s7", name: "Grace Lee", orderIndex: 0 }],
    teacherAuthors: [{ id: "t5", name: "Dr. James Rodriguez", orderIndex: 0 }],
  },
  {
    id: "ch5",
    title: "Blockchain Technology",
    abstract: "Understanding distributed ledger technology.",
    imageUrl: null,
    documentUrl: null,
    status: "REJECTED",
    isbnIssn: "978-3-16-148413-1",
    registrationFees: 180.0,
    reimbursement: 0,
    isPublic: false,
    createdAt: new Date("2024-01-30"),
    updatedAt: new Date("2024-02-28"),
    studentAuthors: [{ id: "s7", name: "Grace Lee", orderIndex: 0 }],
    teacherAuthors: [{ id: "t5", name: "Dr. James Rodriguez", orderIndex: 0 }],
  },
  {
    id: "ch5",
    title: "Blockchain Technology",
    abstract: "Understanding distributed ledger technology.",
    imageUrl: null,
    documentUrl: null,
    status: "REJECTED",
    isbnIssn: "978-3-16-148413-1",
    registrationFees: 180.0,
    reimbursement: 0,
    isPublic: false,
    createdAt: new Date("2024-01-30"),
    updatedAt: new Date("2024-02-28"),
    studentAuthors: [{ id: "s7", name: "Grace Lee", orderIndex: 0 }],
    teacherAuthors: [{ id: "t5", name: "Dr. James Rodriguez", orderIndex: 0 }],
  },
  {
    id: "ch5",
    title: "Blockchain Technology",
    abstract: "Understanding distributed ledger technology.",
    imageUrl: null,
    documentUrl: null,
    status: "REJECTED",
    isbnIssn: "978-3-16-148413-1",
    registrationFees: 180.0,
    reimbursement: 0,
    isPublic: false,
    createdAt: new Date("2024-01-30"),
    updatedAt: new Date("2024-02-28"),
    studentAuthors: [{ id: "s7", name: "Grace Lee", orderIndex: 0 }],
    teacherAuthors: [{ id: "t5", name: "Dr. James Rodriguez", orderIndex: 0 }],
  },
];

// Helper for status styling
const getStatusBadgeVariant = (status: PublicationStatus) => {
  switch (status) {
    case "PUBLISHED":
      return "default"; // Usually black/primary
    case "SUBMITTED":
      return "secondary"; // Gray/Blueish
    case "DRAFT":
      return "outline"; // White/Border
    case "REJECTED":
      return "destructive"; // Red
    default:
      return "secondary";
  }
};

const getStatusColorClass = (status: PublicationStatus) => {
  switch (status) {
    case "PUBLISHED":
      return "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200";
    case "SUBMITTED":
      return "bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-200";
    case "DRAFT":
      return "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200";
    case "REJECTED":
      return "bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-200";
    default:
      return "";
  }
};

// --- Actions Component ---
const ChapterActions = ({ chapter }: { chapter: BookChapter }) => (
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
      <DropdownMenuItem>
        <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
        View details
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
        Edit chapter
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
        <Trash className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

// --- Table Columns ---

export const columns: ColumnDef<BookChapter>[] = [
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
          {status}
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
      const students = row.original.studentAuthors;
      const teachers = row.original.teacherAuthors;
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
      const date = row.getValue("updatedAt") as Date;
      return <div className="text-sm text-muted-foreground">{date.toLocaleDateString()}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ChapterActions chapter={row.original} />,
  },
];

// --- Main Component ---

export default function BookChapterTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [viewMode, setViewMode] = React.useState<"table" | "card">("table");
  const [isExportHovered, setIsExportHovered] = React.useState(false);
const [filters, setFilters] = React.useState<{
    status?: string;
    isPublic?: boolean;
    title?: string;
    isbnIssn?: string;
    minFees?: number;
    maxFees?: number;
    createdAfter?: string;
    createdBefore?: string;
    updatedAfter?: string;
    updatedBefore?: string;
    teacherName?: string[];
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    all?: boolean;
  }>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  
  // Filter management functions
  const updateFilter = (key: string, value: any) => {
    const updates: any = {
      ...{ [key]: value },
    };

    // When changing page, don't reset to page 1
    if (key === "page" || key === "limit") {
      // If changing page/limit, disable "all" mode
      if (key === "page") {
        updates.all = false;
      }
    } else {
      // For other filters, reset to page 1
      updates.page = 1;
    }

    setFilters((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1,
      all: false, // Disable "all" when applying filters
    }));
  };

  const clearFilters = () => {
 setFilters({
      page: 1,
      limit: filters.limit || 10,
      sortBy: "createdAt",
      sortOrder: "desc",
      all: false,
    });
  };
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
    initialState: {
      pagination: { pageSize: 5 },
    },
  });

  // Export CSV Function
  const exportCSV = () => {
    const headers = [
      "ID",
      "Title",
      "Status",
      "Student Authors",
      "Updated At",
    ];
    const rows = table.getFilteredRowModel().rows.map((row) => [
      row.original.id,
      `"${row.original.title.replace(/"/g, '""')}"`,
      row.original.status,
      `"${row.original.studentAuthors.map((a) => a.name).join(", ")}"`,
      row.original.updatedAt.toLocaleDateString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "book_chapters.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6 p-1">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Book Chapters
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your publication entries, authors, and statuses.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 bg-accent hover:bg-accent/80" 
            onClick={exportCSV}
            onMouseEnter={() => setIsExportHovered(true)}
            onMouseLeave={() => setIsExportHovered(false)}
          >
            <Download animate={isExportHovered} animation="default-loop" className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button size="sm" className="h-9 bg-chart-3 duration-800 cursor-pointer transition-all  hover:bg-accent border-green-600 hover:text-primary-foreground hover:border-accent/80 active:bg-accent/80 active:text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> Add Chapter
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search titles..."
              value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("title")?.setFilterValue(event.target.value)
              }
              className="h-9 pl-9 w-full bg-background"
            />
          </div>
          <Separator orientation="vertical" className="hidden h-6 md:block" />
          
          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 border-dashed bg-accent hover:bg-accent/80">
                <ChevronDown className="mr-2 h-4 w-4" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[180px]">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => table.getColumn("status")?.setFilterValue("")}>
                All Statuses
              </DropdownMenuItem>
              {["DRAFT", "SUBMITTED", "PUBLISHED", "REJECTED"].map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => table.getColumn("status")?.setFilterValue(status)}
                >
                  <Badge variant="outline" className={`mr-2 h-2 w-2 rounded-full p-0 border-0 ${getStatusColorClass(status as PublicationStatus).replace("text-", "bg-")}`} />
                  <span className="capitalize">{status.toLowerCase()}</span>
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
        {viewMode === "table" ? (
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
              return (
                <div
                  key={row.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-muted  p-5 shadow-sm transition-all hover:shadow-2xl hover:border-primary/20 hover:scale-105 duration-400"
                >
                  <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <ChapterActions chapter={chapter} />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                        <Badge
                          variant="outline"
                          className={`font-medium border ${getStatusColorClass(chapter.status)}`}
                        >
                          {chapter.status}
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
                            <span>{(chapter.studentAuthors.length + chapter.teacherAuthors.length)} Authors</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{chapter.updatedAt.toLocaleDateString()}</span>
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
                {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected
            </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground hidden sm:block">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-14 bg-accent text-black ">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 30].map((pageSize) => (
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
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronDown className="h-4 w-4 rotate-90 " />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 bg-accent"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}



