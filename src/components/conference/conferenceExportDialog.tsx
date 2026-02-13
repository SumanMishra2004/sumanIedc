"use client"

import * as React from "react"
import { FileDown, Loader2 } from "lucide-react"
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
import { ConferenceFilters } from "@/types/conference"
import { exportConferences } from "@/lib/research/conferenceApi"

interface ExportDialogProps {
  filters?: ConferenceFilters
  trigger?: React.ReactNode
}

export function ConferenceExportDialog({ filters, trigger }: ExportDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await exportConferences(filters)
      if (response.error) {
        toast.error("Export failed", {
          description: response.error,
        })
      } else {
        toast.success("Export started", {
          description: "Your CSV file is being downloaded.",
        })
        setOpen(false)
      }
    } catch (error) {
      toast.error("Export failed", {
        description: "An unexpected error occurred.",
      })
      console.error(error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Conferences</DialogTitle>
          <DialogDescription>
            Download a CSV file of conferences matching your current filters.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            The export will include all fields for the filtered conferences. 
            Depending on the number of records, this may take a few moments.
          </p>
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
                <FileDown className="mr-2 h-4 w-4" />
                Export CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
