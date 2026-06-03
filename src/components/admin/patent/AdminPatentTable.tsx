"use client"

import * as React from "react"
import {
  MoreHorizontal,
  Search,
  Eye,
  Trash2,
  Globe,
  Lock,
  Download,
  CheckCircle,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  getPatents,
  deletePatent,
  exportPatents,
  updatePatent,
} from "@/lib/research/patentApi"
import { Patent, PatentFilters } from "@/types/patent"
import AdminPatentFilters, { PatentFilterValues } from "./AdminPatentFilters"
import AdminPatentDetail from "./AdminPatentDetail"

interface AdminPatentTableProps {
  onRefresh?: () => void
}

export default function AdminPatentTable({ onRefresh }: AdminPatentTableProps) {
  const [data, setData] = React.useState<Patent[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filters, setFilters] = React.useState<PatentFilterValues>({})
  const [pagination, setPagination] = React.useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  })

  const [selectedPatent, setSelectedPatent] = React.useState<Patent | null>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    const apiFilters: PatentFilters = {
      page: pagination.page,
      limit: pagination.limit,
      search: searchTerm || undefined,
      ...filters,
    }

    const response = await getPatents(apiFilters)
    if (response.data) {
      setData(response.data.patents)
      setPagination(prev => ({
        ...prev,
        total: response.data!.pagination.total,
        totalPages: response.data!.pagination.totalPages,
      }))
    } else {
      toast.error(response.error || "Failed to load patents")
    }
    setIsLoading(false)
  }, [pagination.page, pagination.limit, searchTerm, filters])

  React.useEffect(() => {
    const id = setTimeout(() => {
      void loadData()
    }, 300)
    return () => clearTimeout(id)
  }, [loadData])

  const handleFilterChange = (key: keyof PatentFilterValues, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleClearFilters = () => {
    setFilters({})
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this patent? This action is permanent.")) return
    const response = await deletePatent(id)
    if (response.data) {
      toast.success("Patent deleted successfully!")
      void loadData()
      onRefresh?.()
    } else {
      toast.error(response.error || "Failed to delete patent")
    }
  }

  const handlePublish = async (id: string) => {
    const response = await updatePatent(id, { patentStatus: "GRANTED" })
    if (response.data) {
      toast.success("Patent status updated to GRANTED!")
      void loadData()
      onRefresh?.()
    } else {
      toast.error(response.error || "Failed to update status")
    }
  }

  const handleToggleVisibility = async (patent: Patent) => {
    const response = await updatePatent(patent.id, { isPublic: !patent.isPublic })
    if (response.data) {
      toast.success("Visibility toggled successfully!")
      void loadData()
      onRefresh?.()
    } else {
      toast.error(response.error || "Failed to update visibility")
    }
  }

  const handleExport = async () => {
    try {
      const blob = await exportPatents({ ...filters, search: searchTerm || undefined })
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `patents-${new Date().toISOString()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success("CSV exported successfully!")
    } catch {
      toast.error("Failed to export CSV")
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "GRANTED":
        return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
      case "APPROVED":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20"
      case "UNDER_REVIEW":
        return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20"
      default:
        return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-purple-500/20"
    }
  }

  const getTeacherBadgeColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
      case "ACCEPTED":
        return "bg-emerald-500/10 text-emerald-500"
      case "UPDATE":
        return "bg-amber-500/10 text-amber-500"
      case "REJECTED":
        return "bg-red-500/10 text-red-500"
      default:
        return "bg-slate-500/10 text-slate-500"
    }
  }

  return (
    <Card className="border-none shadow-sm bg-card overflow-hidden">
      <CardHeader className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-lg font-bold">Patents Grid</CardTitle>
            <CardDescription className="text-xs">
              View and manage status workflow, visibility controls and CSV export.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="h-9 px-3">
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-4">
        {/* Filters and search block */}
        <div className="flex flex-col md:flex-row gap-3 justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, application number..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-9 h-9"
            />
          </div>
          <AdminPatentFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Responsive Table */}
        <div className="rounded-xl border border-dashed border-border overflow-hidden bg-muted/10">
          <div className="overflow-x-auto max-h-[500px]">
            <Table className="min-w-full">
              <TableHeader className="bg-muted/40 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[80px]">Cover</TableHead>
                  <TableHead className="min-w-[200px]">Title</TableHead>
                  <TableHead className="min-w-[150px]">Authors</TableHead>
                  <TableHead className="min-w-[130px]">Application No</TableHead>
                  <TableHead className="w-[120px]">Teacher Status</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[100px]">Visibility</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-12 w-9 bg-muted rounded" /></TableCell>
                      <TableCell>
                        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </TableCell>
                      <TableCell><div className="h-4 bg-muted rounded w-2/3" /></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded w-1/2" /></TableCell>
                      <TableCell><div className="h-6 bg-muted rounded w-[80px]" /></TableCell>
                      <TableCell><div className="h-6 bg-muted rounded w-[80px]" /></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded w-[60px]" /></TableCell>
                      <TableCell><div className="h-8 w-8 bg-muted rounded-full ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center text-muted-foreground text-sm">
                      No patents found matching filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((patent) => (
                    <TableRow key={patent.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        {patent.imageUrl ? (
                          <img
                            src={patent.imageUrl}
                            alt="Cover"
                            className="h-12 w-9 rounded object-cover shadow-sm bg-muted border"
                          />
                        ) : (
                          <div className="h-12 w-9 rounded bg-muted/40 border border-dashed flex items-center justify-center text-[10px] text-muted-foreground">
                            Patent
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-xs text-foreground line-clamp-1">{patent.title}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            {patent.grantedPatentNo || "Not Granted Yet"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-foreground">
                            {patent.studentAuthors[0]?.user?.name || patent.facultyAuthors[0]?.user?.name || "Author"}
                          </p>
                          {(patent.studentAuthors.length + patent.facultyAuthors.length) > 1 && (
                            <p className="text-[10px] text-muted-foreground">
                              +{patent.studentAuthors.length + patent.facultyAuthors.length - 1} other author(s)
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{patent.applicationNo || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`${getTeacherBadgeColor(patent.teacherStatus)} text-[10px] py-0.5 px-2 font-semibold`}>
                          {patent.teacherStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getStatusBadgeColor(patent.patentStatus)} text-[10px] py-0.5 px-2 font-semibold`}>
                          {patent.patentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-semibold flex items-center gap-1">
                          {patent.isPublic ? "🌐 Public" : "🔒 Private"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[180px]">
                            <DropdownMenuLabel className="text-xs">Management</DropdownMenuLabel>
                            <DropdownMenuItem
                              className="text-xs cursor-pointer"
                              onClick={() => {
                                setSelectedPatent(patent)
                                setIsDetailOpen(true)
                              }}
                            >
                              <Eye className="h-3.5 w-3.5 mr-2 text-purple-600" />
                              View & Audit
                            </DropdownMenuItem>

                            {patent.patentStatus !== "GRANTED" && (
                              <DropdownMenuItem
                                className="text-xs cursor-pointer"
                                onClick={() => handlePublish(patent.id)}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                                Grant Now
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              className="text-xs cursor-pointer"
                              onClick={() => handleToggleVisibility(patent)}
                            >
                              {patent.isPublic ? (
                                <>
                                  <Lock className="h-3.5 w-3.5 mr-2" />
                                  Make Private
                                </>
                              ) : (
                                <>
                                  <Globe className="h-3.5 w-3.5 mr-2 text-blue-600" />
                                  Make Public
                                </>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-xs cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                              onClick={() => handleDelete(patent.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Delete Patent
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination bar */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-4">
          <p>
            Showing {data.length} of {pagination.total} entries
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              className="h-8"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              className="h-8"
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>

      <AdminPatentDetail
        open={isDetailOpen}
        patent={selectedPatent}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedPatent(null)
        }}
        onSuccess={() => {
          void loadData()
          onRefresh?.()
        }}
      />
    </Card>
  )
}
