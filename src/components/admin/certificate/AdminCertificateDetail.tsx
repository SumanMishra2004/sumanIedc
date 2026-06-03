"use client"

import { useState } from "react"
import {
  X,
  FileText,
  User,
  Calendar,
  Globe,
  Lock,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  CheckCircle,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { updateCertificate } from "@/lib/research/certificateApi"
import { Certificate } from "@/types/certificate"

interface AdminCertificateDetailProps {
  certificate: Certificate | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AdminCertificateDetail({
  certificate,
  open,
  onClose,
  onSuccess,
}: AdminCertificateDetailProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [feedback, setFeedback] = useState("")

  if (!certificate) return null

  const handleApprove = async () => {
    setIsUpdating(true)
    try {
      const response = await updateCertificate(certificate.id, {
        certificateStatus: "APPROVED",
        updateComment: null // Clear comments when approved
      })
      if (response.data) {
        toast.success("Certificate successfully approved!")
        onSuccess()
        onClose()
      } else {
        toast.error(response.error || "Failed to approve certificate")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRequestRevision = async () => {
    if (!feedback.trim()) {
      toast.error("Please enter feedback for revision")
      return
    }
    setIsUpdating(true)
    try {
      const response = await updateCertificate(certificate.id, {
        certificateStatus: "SUBMITTED", // Keeps status submitted/under_review
        updateComment: feedback.trim()
      })
      if (response.data) {
        toast.success("Revision feedback submitted to user!")
        setFeedback("")
        onSuccess()
        onClose()
      } else {
        toast.error(response.error || "Failed to submit revision feedback")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleToggleVisibility = async (newVisibility: boolean) => {
    setIsUpdating(true)
    try {
      const response = await updateCertificate(certificate.id, { isPublic: newVisibility })
      if (response.data) {
        toast.success(`Certificate visibility updated to ${newVisibility ? 'Public' : 'Private'}`)
        onSuccess()
        onClose()
      } else {
        toast.error(response.error || "Failed to update visibility")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "UNDER_REVIEW":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      default:
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
    }
  }

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent className="sm:max-w-[600px] p-0 flex flex-col h-full border-l border-purple-100/20">
        <SheetHeader className="p-6 pb-4 border-b flex flex-row items-center justify-between">
          <div>
            <SheetTitle className="text-xl font-bold tracking-tight">
              Certificate Details
            </SheetTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review details and verify certificate legitimacy.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6 pb-6">
            {/* Title Block */}
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="outline" className={getStatusBadgeColor(certificate.certificateStatus)}>
                  {certificate.certificateStatus}
                </Badge>
                <Badge variant="outline" className={certificate.isPublic ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"}>
                  {certificate.isPublic ? "🌐 Public" : "🔒 Private"}
                </Badge>
              </div>
              <h2 className="text-lg font-bold leading-tight text-foreground">
                {certificate.title}
              </h2>
            </div>

            {/* Description */}
            {certificate.description && (
              <div className="space-y-1.5 bg-muted/30 p-4 rounded-xl border border-dashed">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                  <FileText className="h-4 w-4 text-purple-600" />
                  Description
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {certificate.description}
                </p>
              </div>
            )}

            {/* Update Comment Banner */}
            {certificate.updateComment && (
              <div className="space-y-1.5 bg-amber-500/5 p-4 rounded-xl border border-dashed border-amber-500/20">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 text-amber-600">
                  <MessageSquare className="h-4 w-4" />
                  Feedback / Comments
                </h3>
                <p className="text-xs leading-relaxed text-amber-700 font-medium whitespace-pre-wrap">
                  {certificate.updateComment}
                </p>
              </div>
            )}

            <Separator />

            {/* Uploaded By */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <User className="h-4 w-4 text-purple-600" />
                Uploaded By
              </h3>
              <div className="text-xs p-3 bg-muted/40 rounded border">
                <p className="font-semibold text-foreground">{certificate.user?.name || "Unknown User"}</p>
                <p className="text-[10px] text-muted-foreground">{certificate.user?.email}</p>
              </div>
            </div>

            <Separator />

            {/* Certificate Details Metadata */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Certificate Metadata</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground">Offered By (Issuer)</p>
                  <p className="font-semibold text-foreground mt-0.5">{certificate.offeredBy || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 inline text-muted-foreground" />
                    Completion Date
                  </p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {certificate.dateOfCompletion ? format(new Date(certificate.dateOfCompletion), "PPP") : "N/A"}
                  </p>
                </div>
                {certificate.remark && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">User Remarks</p>
                    <p className="font-medium text-foreground mt-0.5">{certificate.remark}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Document Link */}
            {certificate.documentUrl && (
              <div className="bg-purple-500/5 p-4 rounded-xl border border-purple-100/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-purple-600" />
                  <div>
                    <p className="text-xs font-semibold">Certificate Document File</p>
                    <p className="text-[10px] text-muted-foreground">PDF Document Uploaded</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild className="h-8">
                  <a href={certificate.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                    Open File
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            )}

            {/* Feedback Box (Revision request) */}
            {certificate.certificateStatus !== "APPROVED" && (
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-semibold text-foreground">Request Corrections</h3>
                <Textarea
                  placeholder="Enter comments or reasons for correction request..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[80px] text-xs resize-none"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRequestRevision}
                  disabled={isUpdating}
                  className="w-full text-xs"
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-2" />
                  Send Feedback & Request Revision
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Action Panel */}
        <div className="p-6 border-t bg-muted/20 flex flex-col sm:flex-row gap-2 mt-auto">
          {certificate.certificateStatus !== "APPROVED" && (
            <Button
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
              onClick={handleApprove}
              disabled={isUpdating}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Approve Certificate
            </Button>
          )}

          {certificate.certificateStatus === "APPROVED" ? (
            <Badge variant="outline" className="flex-1 py-3 text-center justify-center border-dashed font-semibold bg-emerald-500/10 text-emerald-500 text-sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approved & Verified
            </Badge>
          ) : (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleToggleVisibility(!certificate.isPublic)}
              disabled={isUpdating}
            >
              {certificate.isPublic ? (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Make Private
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Make Public
                </>
              )}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
