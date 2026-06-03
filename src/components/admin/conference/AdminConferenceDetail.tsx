"use client"

import { useState } from "react"
import {
  X,
  FileText,
  User,
  Users,
  Calendar,
  DollarSign,
  Globe,
  Lock,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Ban,
  CheckCircle,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { updateConferenceStatus, updateConference } from "@/lib/research/conferenceApi"
import { Conference } from "@/types/conference"

interface AdminConferenceDetailProps {
  conference: Conference | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AdminConferenceDetail({
  conference,
  open,
  onClose,
  onSuccess,
}: AdminConferenceDetailProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  if (!conference) return null

  const handlePublish = async () => {
    setIsUpdating(true)
    try {
      const response = await updateConferenceStatus(conference.id, "PUBLISHED")
      if (response.data) {
        toast.success("Conference successfully published!")
        onSuccess()
        onClose()
      } else {
        toast.error(response.error || "Failed to publish conference")
      }
    } catch {
      toast.error("An error occurred while publishing")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleToggleVisibility = async (newVisibility: boolean) => {
    setIsUpdating(true)
    try {
      const response = await updateConference(conference.id, { isPublic: newVisibility })
      if (response.data) {
        toast.success(`Conference visibility updated to ${newVisibility ? 'Public' : 'Private'}`)
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
      case "PUBLISHED":
        return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
      case "APPROVED":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20"
      case "PRESENTED":
        return "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border-indigo-500/20"
      case "UNDER_REVIEW":
        return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20"
      default:
        return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-purple-500/20"
    }
  }

  const getTeacherBadgeColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
      case "ACCEPTED":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "UPDATE":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      case "REJECTED":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20"
    }
  }

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent className="sm:max-w-[600px] p-0 flex flex-col h-full border-l border-purple-100/20">
        <SheetHeader className="p-6 pb-4 border-b flex flex-row items-center justify-between">
          <div>
            <SheetTitle className="text-xl font-bold tracking-tight">
              Conference Details
            </SheetTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review details and manage verification workflow.
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
                <Badge variant="outline" className={getStatusBadgeColor(conference.conferenceStatus)}>
                  {conference.conferenceStatus}
                </Badge>
                <Badge variant="outline" className={getTeacherBadgeColor(conference.teacherStatus)}>
                  Reviewer: {conference.teacherStatus}
                </Badge>
                <Badge variant="outline" className={conference.isPublic ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"}>
                  {conference.isPublic ? "🌐 Public" : "🔒 Private"}
                </Badge>
              </div>
              <h2 className="text-lg font-bold leading-tight text-foreground">
                {conference.paperName || conference.conferenceName}
              </h2>
              {conference.paperName && (
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  Presented at: {conference.conferenceName} ({conference.mode})
                </p>
              )}
            </div>

            {/* Abstract */}
            {conference.abstract && (
              <div className="space-y-1.5 bg-muted/30 p-4 rounded-xl border border-dashed">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                  <FileText className="h-4 w-4 text-purple-600" />
                  Abstract
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {conference.abstract}
                </p>
              </div>
            )}

            <Separator />

            {/* Authors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Student Authors */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <User className="h-4 w-4 text-purple-600" />
                  Student Authors
                </h3>
                <div className="space-y-1.5">
                  {conference.studentAuthors.map((sa) => (
                    <div key={sa.id} className="text-xs p-2 bg-muted/40 rounded border">
                      <p className="font-semibold text-foreground">{sa.user?.name || "Unknown Student"}</p>
                      <p className="text-[10px] text-muted-foreground">{sa.user?.email}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Faculty Authors */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-purple-600" />
                  Faculty Reviewers
                </h3>
                <div className="space-y-1.5">
                  {conference.facultyAuthors.map((fa) => (
                    <div key={fa.id} className="text-xs p-2 bg-muted/40 rounded border">
                      <p className="font-semibold text-foreground">{fa.user?.name || "Unknown Faculty"}</p>
                      <p className="text-[10px] text-muted-foreground">{fa.user?.email}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Publication Details Metadata */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Conference & Paper Details</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground">Publisher</p>
                  <p className="font-semibold text-foreground mt-0.5">{conference.conferencePublisher || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Mode</p>
                  <p className="font-semibold text-foreground mt-0.5 capitalize">{conference.mode.toLowerCase()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">DOI</p>
                  <p className="font-semibold text-foreground mt-0.5 truncate max-w-full">
                    {conference.paperDoi ? (
                      <a href={`https://doi.org/${conference.paperDoi}`} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline flex items-center gap-0.5">
                        {conference.paperDoi}
                        <ExternalLink className="h-3 w-3 inline" />
                      </a>
                    ) : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 inline text-muted-foreground" />
                    Conference Date
                  </p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {conference.conferenceDate
                      ? format(new Date(conference.conferenceDate), "PPP")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 inline text-muted-foreground" />
                    Registration Fees
                  </p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {conference.registrationFees !== null ? `₹${conference.registrationFees.toLocaleString()}` : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 inline text-muted-foreground" />
                    Reimbursement Allowed
                  </p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {conference.reimbursement !== null ? `₹${conference.reimbursement.toLocaleString()}` : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Document Link */}
            {conference.documentUrl && (
              <div className="bg-purple-500/5 p-4 rounded-xl border border-purple-100/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-purple-600" />
                  <div>
                    <p className="text-xs font-semibold">Manuscript / Paper File</p>
                    <p className="text-[10px] text-muted-foreground">PDF Document Uploaded</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild className="h-8">
                  <a href={conference.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                    Open File
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Action Panel */}
        <div className="p-6 border-t bg-muted/20 flex flex-col sm:flex-row gap-2 mt-auto">
          {conference.conferenceStatus !== "PUBLISHED" && (
            <Button
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
              onClick={handlePublish}
              disabled={isUpdating}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Approve and Publish
            </Button>
          )}

          {conference.conferenceStatus === "PUBLISHED" ? (
            <Badge variant="outline" className="flex-1 py-3 text-center justify-center border-dashed font-semibold bg-emerald-500/10 text-emerald-500 text-sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              Verified & Published
            </Badge>
          ) : (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleToggleVisibility(!conference.isPublic)}
              disabled={isUpdating}
            >
              {conference.isPublic ? (
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
