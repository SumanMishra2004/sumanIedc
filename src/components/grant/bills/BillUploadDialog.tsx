"use client"

import * as React from "react"
import { Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { BillType } from "@prisma/client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { uploadBill } from "@/lib/research/grant-in"

interface BillUploadDialogProps {
  grantId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const BILL_TYPE_LABELS: Record<BillType, string> = {
  REGISTRATION: "Registration",
  TRAVEL: "Travel",
  ACCOMMODATION: "Accommodation",
  HARDWARE: "Hardware",
  SUBSCRIPTION: "Subscription",
  OTHER: "Other",
}

export function BillUploadDialog({
  grantId,
  open,
  onOpenChange,
  onSuccess,
}: BillUploadDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [billType, setBillType] = React.useState<BillType>(BillType.OTHER)
  const [amount, setAmount] = React.useState("")
  const [billDate, setBillDate] = React.useState(
    new Date().toISOString().split("T")[0]
  )
  const [file, setFile] = React.useState<File | null>(null)

  const reset = () => {
    setBillType(BillType.OTHER)
    setAmount("")
    setBillDate(new Date().toISOString().split("T")[0])
    setFile(null)
  }

  React.useEffect(() => {
    if (!open) reset()
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error("Please select a file to upload")
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("billType", billType)
    if (amount) formData.append("amount", amount)
    formData.append("billDate", billDate)

    setLoading(true)
    try {
      const result = await uploadBill(grantId, formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Bill uploaded successfully")
        onOpenChange(false)
        onSuccess()
      }
    } catch {
      toast.error("Failed to upload bill")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Bill</DialogTitle>
          <DialogDescription>
            Upload a bill or expense receipt for this grant.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Bill Type</Label>
            <Select
              value={billType}
              onValueChange={(v) => setBillType(v as BillType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(BillType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {BILL_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billDate">Bill Date</Label>
              <Input
                id="billDate"
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">
              File <span className="text-red-500">*</span>
            </Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Accepted formats: PDF, JPG, PNG. Max 10 MB.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !file}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload Bill
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
