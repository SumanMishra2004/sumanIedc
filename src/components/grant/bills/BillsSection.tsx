"use client"

import * as React from "react"
import { Download, ExternalLink, Loader2, ShieldCheck, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { BillStatus, BillType, UserRole } from "@prisma/client"
import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { GrantInBill } from "@/types/grant-in"
import { deleteBill } from "@/lib/research/grant-in"
import { BillUploadDialog } from "./BillUploadDialog"
import { BillStatusDialog } from "./BillStatusDialog"

interface BillsSectionProps {
  bills: GrantInBill[]
  grantId: string
  userRole: UserRole
  currentUserId: string
  /** True if current user is PI or Co-PI of this grant */
  isPiOrCoPi: boolean
  /** True if current user is any faculty/student member of this grant */
  isMember: boolean
  onBillsChange: () => void
}

const BILL_TYPE_LABELS: Record<BillType, string> = {
  REGISTRATION: "Registration",
  TRAVEL: "Travel",
  ACCOMMODATION: "Accommodation",
  HARDWARE: "Hardware",
  SUBSCRIPTION: "Subscription",
  OTHER: "Other",
}

const BILL_STATUS_CONFIG: Record<BillStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pending", variant: "secondary" },
  ACCEPTED: { label: "Accepted", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  PAID: { label: "Paid", variant: "outline" },
}

export function BillsSection({
  bills,
  grantId,
  userRole,
  currentUserId,
  isPiOrCoPi,
  isMember,
  onBillsChange,
}: BillsSectionProps) {
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [reviewBillId, setReviewBillId] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const isAdmin = userRole === UserRole.ADMIN
  const canUpload = isAdmin || isMember
  const canReviewBills = isAdmin || isPiOrCoPi
  const canDownloadMaster = userRole !== UserRole.STUDENT

  const canDeleteBill = (bill: GrantInBill) => {
    const isUploader = bill.userId === currentUserId
    if (bill.billStatus === BillStatus.PENDING) {
      return isUploader || canReviewBills
    }
    // ACCEPTED / PAID bills need higher auth
    return canReviewBills
  }

  const handleDelete = async (bill: GrantInBill) => {
    if (!confirm("Delete this bill? This cannot be undone.")) return
    setDeletingId(bill.id)
    try {
      const result = await deleteBill(grantId, bill.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Bill deleted")
        onBillsChange()
      }
    } catch {
      toast.error("Failed to delete bill")
    } finally {
      setDeletingId(null)
    }
  }

  const regularBills = bills.filter((b) => !b.isMasterPdf)
  const masterPdf = bills.find((b) => b.isMasterPdf)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Bills & Expenses
          </h4>
          <Badge variant="outline">{regularBills.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {canDownloadMaster && masterPdf?.fileUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={masterPdf.fileUrl} download target="_blank" rel="noopener noreferrer">
                <Download className="mr-1 h-3.5 w-3.5" />
                Download Master PDF
              </a>
            </Button>
          )}
          {canUpload && (
            <Button size="sm" onClick={() => setUploadOpen(true)}>
              <Upload className="mr-1 h-3.5 w-3.5" />
              Upload Bill
            </Button>
          )}
        </div>
      </div>

      {regularBills.length === 0 ? (
        <div className="p-6 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
          No bills uploaded yet.
          {canUpload && ' Click "Upload Bill" to add the first expense.'}
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regularBills.map((bill) => {
                const statusCfg = BILL_STATUS_CONFIG[bill.billStatus]
                return (
                  <TableRow key={bill.id}>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {BILL_TYPE_LABELS[bill.billType]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-emerald-600">
                      {bill.amount != null
                        ? new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                            maximumFractionDigits: 0,
                          }).format(bill.amount)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(bill.billDate), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusCfg.variant} className="text-xs">
                        {statusCfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={bill.user?.image || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {bill.user?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate max-w-[100px]">
                          {bill.user?.name || "Unknown"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {bill.fileUrl && (
                          <Button variant="ghost" size="sm" asChild>
                            <a
                              href={bill.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View file"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                        {canReviewBills &&
                          bill.billStatus === BillStatus.PENDING && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Review bill"
                              onClick={() => setReviewBillId(bill.id)}
                            >
                              <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                            </Button>
                          )}
                        {canDeleteBill(bill) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete bill"
                            onClick={() => handleDelete(bill)}
                            disabled={deletingId === bill.id}
                          >
                            {deletingId === bill.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <BillUploadDialog
        grantId={grantId}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={onBillsChange}
      />

      <BillStatusDialog
        grantId={grantId}
        billId={reviewBillId}
        open={!!reviewBillId}
        onOpenChange={(open) => !open && setReviewBillId(null)}
        onSuccess={onBillsChange}
      />
    </div>
  )
}
