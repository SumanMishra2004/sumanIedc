"use client"

import * as React from "react"
import { Download, FileDown, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { PatentFilters } from "@/types/patent"
import { FilterDialog } from "./patentFilterDialog"

interface ExportDialogProps {
  triggerButton?: React.ReactNode
}

export function ExportDialog({ triggerButton }: ExportDialogProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)
  const [filters, setFilters] = React.useState<PatentFilters>({})

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Build query params from filters
      const params = new URLSearchParams()
      
      if (filters.patentStatus) params.append('patentStatus', filters.patentStatus)
      if (filters.teacherStatus) params.append('teacherStatus', filters.teacherStatus)
      if (filters.isPublic !== undefined) params.append('isPublic', String(filters.isPublic))
      if (filters.keyword) params.append('keyword', filters.keyword)
      if (filters.applicationNo) params.append('applicationNo', filters.applicationNo)
      if (filters.grantedPatentNo) params.append('grantedPatentNo', filters.grantedPatentNo)
      if (filters.search) params.append('search', filters.search)
      if (filters.createdFrom) params.append('createdFrom', filters.createdFrom)
      if (filters.createdTo) params.append('createdTo', filters.createdTo)
      if (filters.filingDateFrom) params.append('filingDateFrom', filters.filingDateFrom)
      if (filters.filingDateTo) params.append('filingDateTo', filters.filingDateTo)
      if (filters.submissionDateFrom) params.append('submissionDateFrom', filters.submissionDateFrom)
      if (filters.submissionDateTo) params.append('submissionDateTo', filters.submissionDateTo)
      if (filters.publicationDateFrom) params.append('publicationDateFrom', filters.publicationDateFrom)
      if (filters.publicationDateTo) params.append('publicationDateTo', filters.publicationDateTo)
      if (filters.grantDateFrom) params.append('grantDateFrom', filters.grantDateFrom)
      if (filters.grantDateTo) params.append('grantDateTo', filters.grantDateTo)
      if (filters.facultyAuthorIds?.length) params.append('facultyAuthorIds', filters.facultyAuthorIds.join(','))
      if (filters.studentAuthorIds?.length) params.append('studentAuthorIds', filters.studentAuthorIds.join(','))

      const queryString = params.toString()
      const url = `/api/research/patent/export${queryString ? `?${queryString}` : ''}`

      // Fetch the CSV file
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Download the file
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `patents-${new Date().toISOString()}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)

      toast.success('Patents exported successfully!')
      setOpen(false)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export patents')
    } finally {
      setIsExporting(false)
    }
  }

  const handleFiltersChange = (newFilters: Partial<PatentFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const handleClearFilters = () => {
    setFilters({})
  }

  const activeFilterCount = React.useMemo(() => {
    let count = 0
    if (filters.patentStatus) count++
    if (filters.teacherStatus) count++
    if (filters.isPublic !== undefined) count++
    if (filters.keyword) count++
    if (filters.applicationNo) count++
    if (filters.grantedPatentNo) count++
    if (filters.createdFrom || filters.createdTo) count++
    if (filters.filingDateFrom || filters.filingDateTo) count++
    if (filters.submissionDateFrom || filters.submissionDateTo) count++
    if (filters.publicationDateFrom || filters.publicationDateTo) count++
    if (filters.grantDateFrom || filters.grantDateTo) count++
    if (filters.facultyAuthorIds && filters.facultyAuthorIds.length > 0) count++
    if (filters.studentAuthorIds && filters.studentAuthorIds.length > 0) count++
    return count
  }, [filters])

  const triggerButtonContent = triggerButton || (
    <Button variant="outline" className="gap-2">
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  )

  const content = (
    <div className="space-y-6">
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Export Filters</h4>
        <p className="text-sm text-muted-foreground">
          Apply filters to export specific patents. Leave empty to export all accessible patents.
        </p>
      </div>

      <FilterDialog
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        triggerButton={
          <Button variant="outline" className="w-full gap-2">
            <FileDown className="h-4 w-4" />
            Configure Export Filters
            {activeFilterCount > 0 && ` (${activeFilterCount} active)`}
          </Button>
        }
      />

      <div className="rounded-lg bg-muted p-4 space-y-2">
        <h5 className="text-sm font-semibold">Export Summary</h5>
        {activeFilterCount > 0 ? (
          <p className="text-sm text-muted-foreground">
            Exporting patents with {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Exporting all accessible patents
          </p>
        )}
      </div>
    </div>
  )

  const footerContent = (
    <div className="flex gap-2 w-full">
      <Button
        variant="outline"
        onClick={() => setOpen(false)}
        disabled={isExporting}
        className="flex-1"
      >
        Cancel
      </Button>
      <Button
        onClick={handleExport}
        disabled={isExporting}
        className="flex-1 gap-2"
      >
        {isExporting && <Loader2 className="h-4 w-4 animate-spin" />}
        {isExporting ? 'Exporting...' : 'Export CSV'}
      </Button>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {triggerButtonContent}
        </DrawerTrigger>
        <DrawerContent className="max-h-[90vh] flex flex-col">
          <DrawerHeader className="pb-4">
            <DrawerTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Patents
            </DrawerTitle>
            <DrawerDescription>
              Configure export settings and download patents as CSV
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-auto px-4">
            {content}
          </div>
          <DrawerFooter className="pt-4">
            {footerContent}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButtonContent}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Patents
          </DialogTitle>
          <DialogDescription>
            Configure export settings and download patents as CSV
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {content}
        </div>
        <DialogFooter className="pt-4">
          {footerContent}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
