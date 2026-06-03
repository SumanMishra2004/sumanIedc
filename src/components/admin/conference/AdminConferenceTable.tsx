"use client"

import * as React from "react"
import {
  MoreHorizontal,
  ChevronDown,
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
  getConferences,
  deleteConference,
  exportConferences,
  updateConferenceStatus,
  updateConference,
} from "@/lib/research/conferenceApi"
import { Conference, ConferenceFilters } from "@/types/conference"
import AdminConferenceFilters, { ConferenceFilterValues } from "./AdminConferenceFilters"
import AdminConferenceDetail from "./AdminConferenceDetail"

interface AdminConferenceTableProps {
  onRefresh?: () => void
}

export default function AdminConferenceTable({ onRefresh }: AdminConferenceTableProps) {
  const [data, setData] = React.useState<Conference[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filters, setFilters] = React.useState<ConferenceFilterValues>({})
  const [pagination, setPagination] = React.useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  })

  const [selectedConference, setSelectedConference] = React.useState<Conference | null>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    const apiFilters: ConferenceFilters = {
      page: pagination.page,
      limit: pagination.limit,
      search: searchTerm || undefined,
      ...filters,
    }

    const response = await getConferences(apiFilters)
    if (response.data) {
      setData(response.data.conferences)
      setPagination(prev => ({
        ...prev,
        total: response.data!.pagination.total,
        totalPages: response.data!.pagination.totalPages,
      }))
    } else {
      toast.error(response.error || "Failed to load conferences")
    }
    setIsLoading(false)
  }, [pagination.page, pagination.limit, searchTerm, filters])

  React.useEffect(() => {
    const id = setTimeout(() => {
      void loadData()
    }, 300)
    return () => clearTimeout(id)
  }, [loadData])

  const handleFilterChange = (key: keyof ConferenceFilterValues, value: any) => {
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
    if (!confirm("Are you sure you want to delete this conference? This action is permanent.")) return
    const response = await deleteConference(id)
    if (response.data) {
      toast.success("Conference deleted successfully!")
      void loadData()
      onRefresh?.()
    } else {
      toast.error(response.error || "Failed to delete conference")
    }
  }

  const handlePublish = async (id: string) => {
    const response = await updateConferenceStatus(id, "PUBLISHED")
    if (response.data) {
      toast.success("Conference successfully published!")
      void loadData()
      onRefresh?.()
    } else {
      toast.error(response.error || "Failed to publish")
    }
  }

  const handleToggleVisibility = async (conf: Conference) => {
    const response = await updateConference(conf.id, { isPublic: !conf.isPublic })
    if (response.data) {
      toast.success("Visibility toggled successfully!")
      void loadData()
      onRefresh?.()
    } else {
      toast.error(response.error || "Failed to update visibility")
    }
  }

  const handleExport = async () => {
    toast.promise(
      exportConferences({ ...filters, search: searchTerm || undefined }),
      {
        loading: "Exporting CSV...",
        success: "CSV exported successfully!",
        error: "Failed to export CSV",
      }
    )
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
      case "APPROVED":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20"
      case "PRESENTED":
        return "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border-indigo-500/20"
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
            <CardTitle className="text-lg font-bold">Conferences Grid</CardTitle>
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
              placeholder="Search by name, paper, publisher, DOI..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-9 h-9"
            />
          </div>
          <AdminConferenceFilters
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
                  <TableHead className="min-w-[200px]">Conference / Paper</TableHead>
                  <TableHead className="min-w-[150px]">Authors</TableHead>
                  <TableHead className="w-[100px]">Mode</TableHead>
                  <TableHead className="min-w-[130px]">Publisher</TableHead>
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
                      <TableCell>
                        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </TableCell>
                      <TableCell><div className="h-4 bg-muted rounded w-2/3" /></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded w-[60px]" /></TableCell>
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
                      No conferences found matching filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((conf) => (
                    <TableRow key={conf.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-xs text-foreground line-clamp-1">{conf.paperName || conf.conferenceName}</p>
                          {conf.paperName && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                              At: {conf.conferenceName}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-foreground">
                            {conf.studentAuthors[0]?.user?.name || "Student"}
                          </p>
                          {conf.studentAuthors.length > 1 && (
                            <p className="text-[10px] text-muted-foreground">
                              +{conf.studentAuthors.length - 1} other student(s)
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs capitalize">{conf.mode.toLowerCase()}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{conf.conferencePublisher || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`${getTeacherBadgeColor(conf.teacherStatus)} text-[10px] py-0.5 px-2 font-semibold`}>
                          {conf.teacherStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getStatusBadgeColor(conf.conferenceStatus)} text-[10px] py-0.5 px-2 font-semibold`}>
                          {conf.conferenceStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-semibold flex items-center gap-1">
                          {conf.isPublic ? "🌐 Public" : "🔒 Private"}
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
                                setSelectedConference(conf)
                                setIsDetailOpen(true)
                              }}
                            >
                              <Eye className="h-3.5 w-3.5 mr-2 text-purple-600" />
                              View & Audit
                            </DropdownMenuItem>

                            {conf.conferenceStatus !== "PUBLISHED" && (
                              <DropdownMenuItem
                                className="text-xs cursor-pointer"
                                onClick={() => handlePublish(conf.id)}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                                Publish Now
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              className="text-xs cursor-pointer"
                              onClick={() => handleToggleVisibility(conf)}
                            >
                              {conf.isPublic ? (
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
                              onClick={() => handleDelete(conf.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Delete Conference
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

      <AdminConferenceDetail
        open={isDetailOpen}
        conference={selectedConference}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedConference(null)
        }}
        onSuccess={() => {
          void loadData()
          onRefresh?.()
        }}
      />
    </Card>
  )
}
