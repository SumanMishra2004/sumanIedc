
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
import { useIsMobile } from "@/hooks/use-mobile"
import { FDPFilters } from "@/types/fdp"
import { FilterDialog } from "./fdpFilterDialog"
import { exportFDPsToCSV } from "@/lib/research/fdpApi"

interface ExportDialogProps {
  triggerButton?: React.ReactNode
}

export function ExportDialog({ triggerButton }: ExportDialogProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)
  const [filters, setFilters] = React.useState<FDPFilters>({})

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await exportFDPsToCSV(filters);
      toast.success('FDP records exported successfully!')
      setOpen(false)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export FDP records')
    } finally {
      setIsExporting(false)
    }
  }

  const handleFiltersChange = (newFilters: Partial<FDPFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const handleClearFilters = () => {
    setFilters({})
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <FileDown className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export FDP Records</DialogTitle>
          <DialogDescription>
            Export FDP records to CSV format. You can apply filters to export specific data.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="space-y-1">
                    <h4 className="text-sm font-medium">Export Configuration</h4>
                    <p className="text-xs text-muted-foreground">
                        {Object.keys(filters).length > 0 
                            ? `${Object.keys(filters).length} active filters applied` 
                            : "Exporting all records"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {Object.keys(filters).length > 0 && (
                        <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-8 text-xs">
                            Clear
                        </Button>
                    )}
                    <FilterDialog
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                        onClearFilters={handleClearFilters}
                        triggerButton={
                            <Button variant="outline" size="sm" className="h-8">
                                Configure Filters
                            </Button>
                        }
                    />
                </div>
            </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
                <>
                 <Download className="mr-2 h-4 w-4" />
                 Export CSV
                </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
