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
  getCertificates,
  deleteCertificate,
  updateCertificate,
  exportCertificatesToCSV,
} from "@/lib/research/certificateApi"
import { Certificate, CertificateFilters } from "@/types/certificate"
import AdminCertificateFilters, { CertificateFilterValues } from "./AdminCertificateFilters"
import AdminCertificateDetail from "./AdminCertificateDetail"

interface AdminCertificateTableProps {
  onRefresh?: () => void
}

export default function AdminCertificateTable({ onRefresh }: AdminCertificateTableProps) {
  const [data, setData] = React.useState<Certificate[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filters, setFilters] = React.useState<CertificateFilterValues>({})
  const [pagination, setPagination] = React.useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  })

  const [selectedCertificate, setSelectedCertificate] = React.useState<Certificate | null>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    const apiFilters: CertificateFilters = {
      page: pagination.page,
      limit: pagination.limit,
      search: searchTerm || undefined,
      ...filters,
    }

    const response = await getCertificates(apiFilters)
    if (response.data) {
      setData(response.data.certificates)
      setPagination(prev => ({
        ...prev,
        total: response.data!.pagination.total,
        totalPages: response.data!.pagination.pages, // API uses pages in pagination response for certificates
      }))
    } else {
      toast.error(response.error || "Failed to load certificates")
    }
    setIsLoading(false)
  }, [pagination.page, pagination.limit, searchTerm, filters])

  React.useEffect(() => {
    const id = setTimeout(() => {
      void loadData()
    }, 300)
    return () => clearTimeout(id)
  }, [loadData])

  const handleFilterChange = (key: keyof CertificateFilterValues, value: any) => {
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
    if (!confirm("Are you sure you want to delete this certificate? This action is permanent.")) return
    const response = await deleteCertificate(id)
    if (response.data) {
      toast.success("Certificate deleted successfully!")
      void loadData()
      onRefresh?.()
    } else {
      toast.error(response.error || "Failed to delete certificate")
    }
  }

  const handleApprove = async (id: string) => {
    const response = await updateCertificate(id, { certificateStatus: "APPROVED" })
    if (response.data) {
      toast.success("Certificate successfully approved!")
      void loadData()
      onRefresh?.()
    } else {
      toast.error(response.error || "Failed to approve certificate")
    }
  }

  const handleToggleVisibility = async (certificate: Certificate) => {
    const response = await updateCertificate(certificate.id, { isPublic: !certificate.isPublic })
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
      exportCertificatesToCSV({ ...filters, search: searchTerm || undefined }),
      {
        loading: "Exporting CSV...",
        success: "CSV exported successfully!",
        error: "Failed to export CSV",
      }
    )
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
      case "UNDER_REVIEW":
        return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20"
      default:
        return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-purple-500/20"
    }
  }

  return (
    <Card className="border-none shadow-sm bg-card overflow-hidden">
      <CardHeader className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-lg font-bold">Certificates Grid</CardTitle>
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
              placeholder="Search by title, offered by..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-9 h-9"
            />
          </div>
          <AdminCertificateFilters
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
                  <TableHead className="min-w-[200px]">Title</TableHead>
                  <TableHead className="min-w-[150px]">Offered By</TableHead>
                  <TableHead className="min-w-[130px]">Uploaded By</TableHead>
                  <TableHead className="w-[120px]">Completion Date</TableHead>
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
                      <TableCell><div className="h-4 bg-muted rounded w-1/2" /></TableCell>
                      <TableCell><div className="h-6 bg-muted rounded w-[80px]" /></TableCell>
                      <TableCell><div className="h-6 bg-muted rounded w-[80px]" /></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded w-[60px]" /></TableCell>
                      <TableCell><div className="h-8 w-8 bg-muted rounded-full ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center text-muted-foreground text-sm">
                      No certificates found matching filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((certificate) => (
                    <TableRow key={certificate.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-xs text-foreground line-clamp-1">{certificate.title}</p>
                          {certificate.keywords && certificate.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {certificate.keywords.slice(0, 2).map(kw => (
                                <Badge key={kw} variant="secondary" className="text-[9px] py-0 px-1.5">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-foreground">{certificate.offeredBy || "N/A"}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-foreground">
                            {certificate.user?.name || "User"}
                          </p>
                          <p className="text-[9px] text-muted-foreground">
                            {certificate.user?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {certificate.dateOfCompletion ? format(new Date(certificate.dateOfCompletion), "PP") : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getStatusBadgeColor(certificate.certificateStatus)} text-[10px] py-0.5 px-2 font-semibold`}>
                          {certificate.certificateStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-semibold flex items-center gap-1">
                          {certificate.isPublic ? "🌐 Public" : "🔒 Private"}
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
                                setSelectedCertificate(certificate)
                                setIsDetailOpen(true)
                              }}
                            >
                              <Eye className="h-3.5 w-3.5 mr-2 text-purple-600" />
                              View & Audit
                            </DropdownMenuItem>

                            {certificate.certificateStatus !== "APPROVED" && (
                              <DropdownMenuItem
                                className="text-xs cursor-pointer"
                                onClick={() => handleApprove(certificate.id)}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                                Approve Certificate
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              className="text-xs cursor-pointer"
                              onClick={() => handleToggleVisibility(certificate)}
                            >
                              {certificate.isPublic ? (
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
                              onClick={() => handleDelete(certificate.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Delete Certificate
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

      <AdminCertificateDetail
        open={isDetailOpen}
        certificate={selectedCertificate}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedCertificate(null)
        }}
        onSuccess={() => {
          void loadData()
          onRefresh?.()
        }}
      />
    </Card>
  )
}
