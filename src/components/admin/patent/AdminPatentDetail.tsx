"use client"

import { useState } from "react"
import {
  X,
  FileText,
  User,
  Users,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { updatePatent } from "@/lib/research/patentApi"
import { Patent } from "@/types/patent"

interface AdminPatentDetailProps {
  patent: Patent | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AdminPatentDetail({
  patent,
  open,
  onClose,
  onSuccess,
}: AdminPatentDetailProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  if (!patent) return null

  const handleGrant = async () => {
    setIsUpdating(true)
    try {
      const response = await updatePatent(patent.id, { patentStatus: "GRANTED" })
      if (response.data) {
        toast.success("Patent successfully marked as GRANTED!")
        onSuccess()
        onClose()
      } else {
        toast.error(response.error || "Failed to update patent status")
      }
    } catch {
      toast.error("An error occurred while updating status")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleToggleVisibility = async (newVisibility: boolean) => {
    setIsUpdating(true)
    try {
      const response = await updatePatent(patent.id, { isPublic: newVisibility })
      if (response.data) {
        toast.success(`Patent visibility updated to ${newVisibility ? 'Public' : 'Private'}`)
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
      case "GRANTED":
        return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
      case "APPROVED":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20"
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
              Patent Details
            </SheetTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review details and manage status verification.
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
                <Badge variant="outline" className={getStatusBadgeColor(patent.patentStatus)}>
                  {patent.patentStatus}
                </Badge>
                <Badge variant="outline" className={getTeacherBadgeColor(patent.teacherStatus)}>
                  Reviewer: {patent.teacherStatus}
                </Badge>
                <Badge variant="outline" className={patent.isPublic ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"}>
                  {patent.isPublic ? "🌐 Public" : "🔒 Private"}
                </Badge>
              </div>
              <h2 className="text-lg font-bold leading-tight text-foreground">
                {patent.title}
              </h2>
            </div>

            {/* Abstract */}
            {patent.abstract && (
              <div className="space-y-1.5 bg-muted/30 p-4 rounded-xl border border-dashed">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                  <FileText className="h-4 w-4 text-purple-600" />
                  Abstract
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {patent.abstract}
                </p>
              </div>
            )}

            {/* Update Comment Banner */}
            {patent.updateComment && (
              <div className="space-y-1.5 bg-amber-500/5 p-4 rounded-xl border border-dashed border-amber-500/20">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 text-amber-600">
                  <MessageSquare className="h-4 w-4" />
                  Reviewer Feedback / Comments
                </h3>
                <p className="text-xs leading-relaxed text-amber-700 font-medium whitespace-pre-wrap">
                  {patent.updateComment}
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
                  {patent.studentAuthors.map((sa) => (
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
                  {patent.facultyAuthors.map((fa) => (
                    <div key={fa.id} className="text-xs p-2 bg-muted/40 rounded border">
                      <p className="font-semibold text-foreground">{fa.user?.name || "Unknown Faculty"}</p>
                      <p className="text-[10px] text-muted-foreground">{fa.user?.email}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Patent Details Metadata */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Patent Metadata</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground">Application Number</p>
                  <p className="font-semibold text-foreground mt-0.5">{patent.applicationNo || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Granted Patent Number</p>
                  <p className="font-semibold text-foreground mt-0.5">{patent.grantedPatentNo || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 inline text-muted-foreground" />
                    Filing Date
                  </p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {patent.filingDate ? format(new Date(patent.filingDate), "PPP") : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 inline text-muted-foreground" />
                    Publication Date
                  </p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {patent.publicationDate ? format(new Date(patent.publicationDate), "PPP") : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 inline text-muted-foreground" />
                    Grant Date
                  </p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {patent.grantDate ? format(new Date(patent.grantDate), "PPP") : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Patent Link</p>
                  <p className="font-semibold text-foreground mt-0.5 truncate max-w-full">
                    {patent.patentLink ? (
                      <a href={patent.patentLink} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline flex items-center gap-0.5">
                        Open Patent Link
                        <ExternalLink className="h-3 w-3 inline" />
                      </a>
                    ) : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Document Link */}
            {patent.documentUrl && (
              <div className="bg-purple-500/5 p-4 rounded-xl border border-purple-100/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-purple-600" />
                  <div>
                    <p className="text-xs font-semibold">Patent Document File</p>
                    <p className="text-[10px] text-muted-foreground">PDF Document Uploaded</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild className="h-8">
                  <a href={patent.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
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
          {patent.patentStatus !== "GRANTED" && (
            <Button
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
              onClick={handleGrant}
              disabled={isUpdating}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Approve and Grant
            </Button>
          )}

          {patent.patentStatus === "GRANTED" ? (
            <Badge variant="outline" className="flex-1 py-3 text-center justify-center border-dashed font-semibold bg-emerald-500/10 text-emerald-500 text-sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              Verified & Granted
            </Badge>
          ) : (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleToggleVisibility(!patent.isPublic)}
              disabled={isUpdating}
            >
              {patent.isPublic ? (
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
