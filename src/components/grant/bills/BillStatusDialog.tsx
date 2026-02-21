"use client"

import * as React from "react"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { updateBillStatus } from "@/lib/research/grant-in"

interface BillStatusDialogProps {
  grantId: string
  billId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function BillStatusDialog({
  grantId,
  billId,
  open,
  onOpenChange,
  onSuccess,
}: BillStatusDialogProps) {
  const [loading, setLoading] = React.useState<"ACCEPT" | "REJECT" | null>(null)

  const handleAction = async (action: "ACCEPT" | "REJECT") => {
    if (!billId) return
    setLoading(action)
    try {
      const result = await updateBillStatus(grantId, billId, action)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(action === "ACCEPT" ? "Bill accepted" : "Bill rejected and removed")
        onOpenChange(false)
        onSuccess()
      }
    } catch {
      toast.error("Failed to update bill status")
    } finally {
      setLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Review Bill</DialogTitle>
          <DialogDescription>
            Accept this bill to include it in the master PDF, or reject it to
            remove it from the system.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={!!loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleAction("REJECT")}
            disabled={!!loading}
            className="w-full sm:w-auto"
          >
            {loading === "REJECT" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Reject
          </Button>
          <Button
            onClick={() => handleAction("ACCEPT")}
            disabled={!!loading}
            className="w-full sm:w-auto"
          >
            {loading === "ACCEPT" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
