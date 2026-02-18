"use client"

import * as React from "react"
import { Download, Loader2 } from "lucide-react"
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
import { GrantInFilters } from "@/types/grant-in"
import { GrantFilterDialog } from "./GrantFilterDialog"

interface ExportDialogProps {
  triggerButton?: React.ReactNode
}

export function GrantExportDialog({ triggerButton }: ExportDialogProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)
  const [filters, setFilters] = React.useState<GrantInFilters>({})

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Build query params from filters
      const params = new URLSearchParams()
      
      if (filters.grantInStatus) params.append('grantInStatus', filters.grantInStatus)
      if (filters.projectCode) params.append('projectCode', filters.projectCode)
      if (filters.isPublic !== undefined) params.append('isPublic', String(filters.isPublic))
      
      if (filters.applicationDateFrom) params.append('applicationDateFrom', filters.applicationDateFrom)
      if (filters.applicationDateTo) params.append('applicationDateTo', filters.applicationDateTo)
      if (filters.grantDateFrom) params.append('grantDateFrom', filters.grantDateFrom)
      if (filters.grantDateTo) params.append('grantDateTo', filters.grantDateTo)
      
      if (filters.grantedAmountMin !== undefined) params.append('minAmountGranted', String(filters.grantedAmountMin))
      if (filters.grantedAmountMax !== undefined) params.append('maxAmountGranted', String(filters.grantedAmountMax))
      if (filters.usedAmountMin !== undefined) params.append('minUsedAmount', String(filters.usedAmountMin))
      if (filters.usedAmountMax !== undefined) params.append('maxUsedAmount', String(filters.usedAmountMax))
      
      if (filters.facultyId) params.append('facultyAuthorIds', filters.facultyId) 
      if (filters.studentId) params.append('studentAuthorIds', filters.studentId)

      const queryString = params.toString()
      const url = `/api/research/grant-in/export${queryString ? `?${queryString}` : ''}`

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
      link.download = `grants-${new Date().toISOString()}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)

      toast.success('Grants exported successfully!')
      setOpen(false)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export grants')
    } finally {
      setIsExporting(false)
    }
  }

  const handleFiltersChange = (newFilters: Partial<GrantInFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const handleClearFilters = () => {
    setFilters({})
  }

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {triggerButton || (
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          )}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Export Grants</DrawerTitle>
            <DrawerDescription>
              Filter and export grant records to CSV format.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 py-2">
            <GrantFilterDialog 
              filters={filters} 
              onFiltersChange={handleFiltersChange}
              onClearRun={handleClearFilters}
              embedded
            />
          </div>
          <DrawerFooter className="pt-2">
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isExporting ? "Exporting..." : "Export"}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Grants</DialogTitle>
          <DialogDescription>
            Filter and export grant records to CSV format.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <GrantFilterDialog 
            filters={filters} 
            onFiltersChange={handleFiltersChange}
            onClearRun={handleClearFilters}
            embedded
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
