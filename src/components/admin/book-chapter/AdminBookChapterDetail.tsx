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
import { updateBookChapterReviewStatus, updateBookChapterStatus } from "@/lib/research/bookChapterApi"
import { BookChapter } from "@/types/book-chapter"

interface AdminBookChapterDetailProps {
  chapter: BookChapter | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AdminBookChapterDetail({
  chapter,
  open,
  onClose,
  onSuccess,
}: AdminBookChapterDetailProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  if (!chapter) return null

  const handlePublish = async () => {
    setIsUpdating(true)
    try {
      const response = await updateBookChapterStatus(chapter.id, "PUBLISHED")
      if (response.data) {
        toast.success("Book chapter successfully published!")
        onSuccess()
        onClose()
      } else {
        toast.error(response.error || "Failed to publish book chapter")
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
      const response = await updateBookChapterReviewStatus(chapter.id, chapter.teacherStatus, null) // Triggers simple update
      if (response.data) {
        toast.success(`Book chapter visibility updated to ${newVisibility ? 'Public' : 'Private'}`)
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
              Book Chapter Details
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
                <Badge variant="outline" className={getStatusBadgeColor(chapter.bookChapterStatus)}>
                  {chapter.bookChapterStatus}
                </Badge>
                <Badge variant="outline" className={getTeacherBadgeColor(chapter.teacherStatus)}>
                  Reviewer: {chapter.teacherStatus}
                </Badge>
                <Badge variant="outline" className={chapter.isPublic ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"}>
                  {chapter.isPublic ? "🌐 Public" : "🔒 Private"}
                </Badge>
              </div>
              <h2 className="text-lg font-bold leading-tight text-foreground">
                {chapter.title}
              </h2>
            </div>

            {/* Abstract */}
            {chapter.abstract && (
              <div className="space-y-1.5 bg-muted/30 p-4 rounded-xl border border-dashed">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                  <FileText className="h-4 w-4 text-purple-600" />
                  Abstract
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {chapter.abstract}
                </p>
              </div>
            )}

            {/* Update Comment Banner */}
            {chapter.updateComment && (
              <div className="space-y-1.5 bg-amber-500/5 p-4 rounded-xl border border-dashed border-amber-500/20">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 text-amber-600">
                  <MessageSquare className="h-4 w-4" />
                  Reviewer Feedback / Comments
                </h3>
                <p className="text-xs leading-relaxed text-amber-700 font-medium whitespace-pre-wrap">
                  {chapter.updateComment}
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
                  {chapter.studentAuthors.map((sa) => (
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
                  {chapter.facultyAuthors.map((fa) => (
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
              <h3 className="text-sm font-semibold text-foreground">Publication Details</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground">Publisher</p>
                  <p className="font-semibold text-foreground mt-0.5">{chapter.publisher || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">ISBN/ISSN</p>
                  <p className="font-semibold text-foreground mt-0.5">{chapter.isbnIssn || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">DOI</p>
                  <p className="font-semibold text-foreground mt-0.5 truncate max-w-full">
                    {chapter.doi ? (
                      <a href={`https://doi.org/${chapter.doi}`} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline flex items-center gap-0.5">
                        {chapter.doi}
                        <ExternalLink className="h-3 w-3 inline" />
                      </a>
                    ) : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 inline text-muted-foreground" />
                    Publication Date
                  </p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {chapter.publicationDate
                      ? format(new Date(chapter.publicationDate), "PPP")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 inline text-muted-foreground" />
                    Registration Fees
                  </p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {chapter.registrationFees !== null ? `₹${chapter.registrationFees.toLocaleString()}` : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 inline text-muted-foreground" />
                    Reimbursement Allowed
                  </p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {chapter.reimbursement !== null ? `₹${chapter.reimbursement.toLocaleString()}` : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Document Link */}
            {chapter.documentUrl && (
              <div className="bg-purple-500/5 p-4 rounded-xl border border-purple-100/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-purple-600" />
                  <div>
                    <p className="text-xs font-semibold">Manuscript / Document File</p>
                    <p className="text-[10px] text-muted-foreground">PDF Document Uploaded</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild className="h-8">
                  <a href={chapter.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
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
          {chapter.bookChapterStatus !== "PUBLISHED" && (
            <Button
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
              onClick={handlePublish}
              disabled={isUpdating}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Approve and Publish
            </Button>
          )}

          {chapter.bookChapterStatus === "PUBLISHED" ? (
            <Badge variant="outline" className="flex-1 py-3 text-center justify-center border-dashed font-semibold bg-emerald-500/10 text-emerald-500 text-sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              Verified & Published
            </Badge>
          ) : (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleToggleVisibility(!chapter.isPublic)}
              disabled={isUpdating}
            >
              {chapter.isPublic ? (
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
