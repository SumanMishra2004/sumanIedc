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
import { JournalFilters } from "@/types/journal"
import { exportJournalsToCSV } from "@/lib/journalApi"
import { FilterDialog } from "./journalFilterDialog"


interface ExportDialogProps {
  triggerButton?: React.ReactNode
}

export function ExportDialog({ triggerButton }: ExportDialogProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)
  const [filters, setFilters] = React.useState<JournalFilters>({})

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Export using the journalApi function
      const result = await exportJournalsToCSV(filters)
      
      if (result.error) {
        throw new Error(result.error)
      }

      toast.success('Journals exported successfully!')
      setOpen(false)
    } catch (error) {
      console.error('Export error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to export journals')
    } finally {
      setIsExporting(false)
    }
  }

  const handleFiltersChange = (newFilters: Partial<JournalFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const handleClearFilters = () => {
    setFilters({})
  }

  const activeFilterCount = React.useMemo(() => {
    let count = 0
    if (filters.status) count++
    if (filters.isPublic !== undefined) count++
    if (filters.journalType) count++
    if (filters.keyword) count++
    if (filters.journalPublisher) count++
    if (filters.search) count++
    if (filters.minRegistrationFees !== undefined) count++
    if (filters.maxRegistrationFees !== undefined) count++
    if (filters.minReimbursement !== undefined) count++
    if (filters.maxReimbursement !== undefined) count++
    if (filters.minImpactFactor !== undefined) count++
    if (filters.maxImpactFactor !== undefined) count++
    if (filters.createdFrom || filters.createdTo) count++
    if (filters.publishedFrom || filters.publishedTo) count++
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
          Apply filters to export specific journals. Leave empty to export all accessible journals.
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
        <p className="text-xs text-muted-foreground mb-2">
          The export will include the following fields:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="space-y-1">
            <p>• Serial No</p>
            <p>• Title Of Journal</p>
            <p>• Paper Title</p>
            <p>• Journal Type</p>
            <p>• Impact Factor</p>
            <p>• Date of Impact Factor</p>
            <p>• Publisher</p>
            <p>• DOI</p>
          </div>
          <div className="space-y-1">
            <p>• Paper Link</p>
            <p>• Status</p>
            <p>• Registration Fees</p>
            <p>• Reimbursement</p>
            <p>• Publication Date</p>
            <p>• Authors</p>
            <p>• Keywords</p>
            <p>• Abstract</p>
          </div>
        </div>
        {activeFilterCount > 0 ? (
          <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">
            Exporting journals with {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">
            Exporting all accessible journals
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
              Export Journals
            </DrawerTitle>
            <DrawerDescription>
              Configure export settings and download journals as CSV
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
            Export Journals
          </DialogTitle>
          <DialogDescription>
            Configure export settings and download journals as CSV
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
