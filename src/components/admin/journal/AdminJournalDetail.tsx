"use client"

import * as React from "react"
import {
  BookOpen,
  Calendar,
  Check,
  Coins,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Info,
  Layers,
  Link as LinkIcon,
  Loader2,
  Users as UsersIcon,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { updateAdminJournal } from "@/lib/admin/adminJournalApi"
import { Journal } from "@/types/journal"

interface AdminJournalDetailProps {
  journal: Journal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

const teacherStatusColors: Record<string, string> = {
  UPLOADED: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  UPDATE: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  REJECTED: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  PUBLISHED: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
}

const journalStatusColors: Record<string, string> = {
  SUBMITTED: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  PUBLISHED: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 text-sm font-medium text-foreground">
          {value ?? <span className="text-muted-foreground italic">Not provided</span>}
        </div>
      </div>
    </div>
  )
}

export default function AdminJournalDetail({
  journal,
  open,
  onOpenChange,
  onUpdate,
}: AdminJournalDetailProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  // Form states
  const [teacherStatus, setTeacherStatus] = React.useState("")
  const [journalStatus, setJournalStatus] = React.useState("")
  const [isPublic, setIsPublic] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [journalName, setJournalName] = React.useState("")
  const [publisher, setPublisher] = React.useState("")
  const [doi, setDoi] = React.useState("")
  const [paperLink, setPaperLink] = React.useState("")
  const [impactFactor, setImpactFactor] = React.useState("")
  const [quartile, setQuartile] = React.useState("")
  const [indexing, setIndexing] = React.useState("")
  const [scope, setScope] = React.useState("")
  const [reviewType, setReviewType] = React.useState("")
  const [accessType, setAccessType] = React.useState("")
  const [publicationMode, setPublicationMode] = React.useState("")
  const [publicationDate, setPublicationDate] = React.useState("")
  const [serialNo, setSerialNo] = React.useState("")
  const [abstract, setAbstract] = React.useState("")
  const [keywords, setKeywords] = React.useState("")
  const [registrationFees, setRegistrationFees] = React.useState("")
  const [reimbursement, setReimbursement] = React.useState("")
  const [updateComment, setUpdateComment] = React.useState("")
  const [isUpdateCommentDialogOpen, setIsUpdateCommentDialogOpen] = React.useState(false)

  // Reset form states when journal changes
  React.useEffect(() => {
    if (journal) {
      setTeacherStatus(journal.teacherStatus)
      setJournalStatus(journal.journalStatus)
      setIsPublic(journal.isPublic)
      setTitle(journal.title || "")
      setJournalName(journal.journalName || "")
      setPublisher(journal.publisher || "")
      setDoi(journal.doi || "")
      setPaperLink(journal.paperLink || "")
      setImpactFactor(journal.impactFactor?.toString() || "")
      setQuartile(journal.quartile || "NOT_APPLICABLE")
      setIndexing(journal.indexing || "")
      setScope(journal.scope || "")
      setReviewType(journal.reviewType || "")
      setAccessType(journal.accessType || "")
      setPublicationMode(journal.publicationMode || "")
      setPublicationDate(
        journal.publicationDate
          ? new Date(journal.publicationDate).toISOString().substring(0, 10)
          : ""
      )
      setSerialNo(journal.serialNo || "")
      setAbstract(journal.abstract || "")
      setKeywords(journal.keywords?.join(", ") || "")
      setRegistrationFees(journal.registrationFees?.toString() || "")
      setReimbursement(journal.reimbursement?.toString() || "")
      setUpdateComment(journal.updateComment || "")
    }
  }, [journal])

  if (!journal) return null

  const handleQuickStatusChange = async (newStatus: string) => {
    if (newStatus === "UPDATE") {
      setUpdateComment("")
      setIsUpdateCommentDialogOpen(true)
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading(`Updating status to ${newStatus.toLowerCase()}...`)
    
    // Automatically promote journalStatus depending on teacherStatus
    const updateData: any = { teacherStatus: newStatus }
    if (newStatus === "ACCEPTED") {
      updateData.journalStatus = "APPROVED"
      updateData.updateComment = null
    } else if (newStatus === "REJECTED") {
      updateData.journalStatus = "SUBMITTED"
      updateData.updateComment = null
    }

    const res = await updateAdminJournal(journal.id, updateData)
    setIsSubmitting(false)
    
    if (res.data) {
      toast.success(`Journal status set to ${formatLabel(newStatus)}`, { id: toastId })
      setTeacherStatus(newStatus)
      if (updateData.journalStatus) {
        setJournalStatus(updateData.journalStatus)
      }
      setUpdateComment("")
      onUpdate()
    } else {
      toast.error(res.error || "Failed to update journal status", { id: toastId })
    }
  }

  const handleConfirmQuickUpdate = async () => {
    if (!updateComment.trim()) {
      toast.error("Please enter a comment explaining the required corrections")
      return
    }
    setIsUpdateCommentDialogOpen(false)
    setIsSubmitting(true)
    const toastId = toast.loading("Updating status and sending notification...")
    
    const updateData: any = {
      teacherStatus: "UPDATE",
      journalStatus: "UNDER_REVIEW",
      updateComment: updateComment
    }

    const res = await updateAdminJournal(journal.id, updateData)
    setIsSubmitting(false)
    
    if (res.data) {
      toast.success("Journal status set to Update Requested", { id: toastId })
      setTeacherStatus("UPDATE")
      setJournalStatus("UNDER_REVIEW")
      onUpdate()
    } else {
      toast.error(res.error || "Failed to update journal status", { id: toastId })
    }
  }

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (teacherStatus === "UPDATE" && !updateComment.trim()) {
      toast.error("Please enter a comment explaining the required corrections")
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading("Saving journal details...")

    const parsedKeywords = keywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k !== "")

    const updateData = {
      teacherStatus,
      journalStatus,
      isPublic,
      title,
      journalName,
      publisher,
      doi,
      paperLink,
      impactFactor: impactFactor !== "" ? parseFloat(impactFactor) : null,
      quartile,
      indexing,
      scope,
      reviewType,
      accessType,
      publicationMode,
      publicationDate: publicationDate !== "" ? new Date(publicationDate) : null,
      serialNo,
      abstract,
      keywords: parsedKeywords,
      registrationFees: registrationFees !== "" ? parseFloat(registrationFees) : null,
      reimbursement: reimbursement !== "" ? parseFloat(reimbursement) : null,
      updateComment: teacherStatus === "UPDATE" ? updateComment : null,
    }

    const res = await updateAdminJournal(journal.id, updateData)
    setIsSubmitting(false)

    if (res.data) {
      toast.success("Journal changes saved successfully", { id: toastId })
      onUpdate()
      onOpenChange(false)
    } else {
      toast.error(res.error || "Failed to save journal changes", { id: toastId })
    }
  }

  function formatLabel(value: string): string {
    return value
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto h-full flex flex-col p-0">
        <div className="p-6 pb-2">
          <SheetHeader className="text-left">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className={teacherStatusColors[journal.teacherStatus]}>
                Teacher: {formatLabel(journal.teacherStatus)}
              </Badge>
              <Badge variant="outline" className={journalStatusColors[journal.journalStatus]}>
                Journal: {formatLabel(journal.journalStatus)}
              </Badge>
              {journal.isPublic ? (
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Public</Badge>
              ) : (
                <Badge variant="secondary">Private</Badge>
              )}
            </div>
            <SheetTitle className="text-xl font-bold line-clamp-2">
              {journal.title}
            </SheetTitle>
            <SheetDescription className="text-xs font-mono text-muted-foreground mt-1">
              Serial No: {journal.serialNo}
            </SheetDescription>
          </SheetHeader>
        </div>

        <Separator />

        <div className="flex-1 px-6 py-4">
          <Tabs defaultValue="overview" className="w-full flex flex-col h-full">
            <TabsList className="grid grid-cols-4 w-full shrink-0">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="authors" className="text-xs sm:text-sm">Authors</TabsTrigger>
              <TabsTrigger value="files" className="text-xs sm:text-sm">Files</TabsTrigger>
              <TabsTrigger value="actions" className="text-xs sm:text-sm">Admin</TabsTrigger>
            </TabsList>

            {/* Overview Content */}
            <TabsContent value="overview" className="space-y-4 pt-4 flex-1">
              <div className="rounded-lg border bg-card p-4 space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-1.5 text-primary">
                  <Info className="h-4 w-4" /> Publication Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 divide-y divide-border md:divide-y-0">
                  <div className="divide-y divide-border">
                    <DetailRow icon={BookOpen} label="Journal Name" value={journal.journalName} />
                    <DetailRow icon={Globe} label="Publisher" value={journal.publisher} />
                    <DetailRow
                      icon={Calendar}
                      label="Publication Date"
                      value={
                        journal.publicationDate
                          ? new Date(journal.publicationDate).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : null
                      }
                    />
                    <DetailRow
                      icon={LinkIcon}
                      label="DOI"
                      value={
                        journal.doi ? (
                          <a
                            href={journal.doi.startsWith("http") ? journal.doi : `https://doi.org/${journal.doi}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-xs break-all"
                          >
                            {journal.doi} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          </a>
                        ) : null
                      }
                    />
                  </div>
                  <div className="divide-y divide-border">
                    <DetailRow icon={Layers} label="Indexing" value={formatLabel(journal.indexing)} />
                    <DetailRow icon={Layers} label="Quartile" value={journal.quartile} />
                    <DetailRow
                      icon={Layers}
                      label="Impact Factor"
                      value={
                        journal.impactFactor ? (
                          <Badge variant="secondary" className="font-mono">
                            {journal.impactFactor.toFixed(3)}
                          </Badge>
                        ) : null
                      }
                    />
                    <DetailRow
                      icon={LinkIcon}
                      label="Paper Link"
                      value={
                        journal.paperLink ? (
                          <a
                            href={journal.paperLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline text-xs break-all"
                          >
                            Visit Paper Link <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          </a>
                        ) : null
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-4 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-1.5 text-primary">
                  <Layers className="h-4 w-4" /> Attributes & Financials
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 divide-y divide-border md:divide-y-0">
                  <div className="divide-y divide-border">
                    <DetailRow icon={Globe} label="Scope" value={formatLabel(journal.scope)} />
                    <DetailRow icon={Info} label="Review Type" value={formatLabel(journal.reviewType)} />
                    <DetailRow icon={Info} label="Access Type" value={formatLabel(journal.accessType)} />
                  </div>
                  <div className="divide-y divide-border">
                    <DetailRow icon={Info} label="Publication Mode" value={formatLabel(journal.publicationMode)} />
                    <DetailRow
                      icon={Coins}
                      label="Registration Fees"
                      value={
                        journal.registrationFees !== null
                          ? `₹${journal.registrationFees.toLocaleString("en-IN")}`
                          : null
                      }
                    />
                    <DetailRow
                      icon={Coins}
                      label="Reimbursement"
                      value={
                        journal.reimbursement !== null
                          ? `₹${journal.reimbursement.toLocaleString("en-IN")}`
                          : null
                      }
                    />
                  </div>
                </div>
              </div>

              {journal.keywords && journal.keywords.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Keywords</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {journal.keywords.map((kw, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {journal.abstract && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Abstract</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3 border border-dashed">
                    {journal.abstract}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Authors Content */}
            <TabsContent value="authors" className="space-y-4 pt-4 flex-1">
              {/* Faculty Authors */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <UsersIcon className="h-4 w-4 text-primary" /> Faculty Authors (
                  {journal.facultyAuthors?.length || 0})
                </h3>
                {journal.facultyAuthors && journal.facultyAuthors.length > 0 ? (
                  <div className="grid gap-3">
                    {journal.facultyAuthors.map((author) => (
                      <div
                        key={author.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/10 transition-colors"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                          {(author.user.name ?? "Faculty")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">
                            {author.user.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {author.user.email}
                          </p>
                        </div>
                        {author.user.department && (
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            {author.user.department}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic p-3 border border-dashed rounded-lg text-center">
                    No faculty authors linked
                  </p>
                )}
              </div>

              {/* Student Authors */}
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <UsersIcon className="h-4 w-4 text-primary" /> Student Authors (
                  {journal.studentAuthors?.length || 0})
                </h3>
                {journal.studentAuthors && journal.studentAuthors.length > 0 ? (
                  <div className="grid gap-3">
                    {journal.studentAuthors.map((author) => (
                      <div
                        key={author.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/10 transition-colors"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                          {(author.user.name ?? "Student")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">
                            {author.user.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {author.user.email}
                          </p>
                        </div>
                        {author.user.department && (
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            {author.user.department}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic p-3 border border-dashed rounded-lg text-center">
                    No student authors linked
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Files Content */}
            <TabsContent value="files" className="space-y-4 pt-4 flex-1">
              <div className="space-y-3">
                {/* Journal PDF */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Journal Paper PDF</p>
                      <p className="text-xs text-muted-foreground">
                        {journal.documentUrl ? "Document uploaded" : "No document uploaded"}
                      </p>
                    </div>
                  </div>
                  {journal.documentUrl && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={journal.documentUrl} target="_blank" rel="noreferrer">
                          <Eye className="h-4 w-4 mr-1.5" /> View
                        </a>
                      </Button>
                      <Button size="sm" asChild>
                        <a href={journal.documentUrl} download target="_blank" rel="noreferrer">
                          <Download className="h-4 w-4 mr-1.5" /> Download
                        </a>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Cover Image */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Journal Cover Image / Acceptance Letter</p>
                      <p className="text-xs text-muted-foreground">
                        {journal.imageUrl ? "Image uploaded" : "No image uploaded"}
                      </p>
                    </div>
                  </div>
                  {journal.imageUrl && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={journal.imageUrl} target="_blank" rel="noreferrer">
                          <Eye className="h-4 w-4 mr-1.5" /> View
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Admin Actions Content */}
            <TabsContent value="actions" className="space-y-6 pt-4 flex-1 pb-6">
              {/* Quick status actions */}
              <div className="rounded-lg border bg-amber-500/5 border-amber-500/20 p-4 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <Check className="h-4 w-4" /> Quick Review Decisions
                </h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  Update the Teacher review status. Accepting will mark the Journal status as &quot;Approved&quot; automatically.
                </p>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1.5"
                    disabled={isSubmitting || teacherStatus === "ACCEPTED" || teacherStatus === "PUBLISHED"}
                    onClick={() => handleQuickStatusChange("ACCEPTED")}
                  >
                    <Check className="h-4 w-4" /> Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-amber-500 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20 font-medium gap-1.5"
                    disabled={isSubmitting || teacherStatus === "UPDATE" || teacherStatus === "PUBLISHED" || teacherStatus === "REJECTED"}
                    onClick={() => handleQuickStatusChange("UPDATE")}
                  >
                    <Info className="h-4 w-4" /> Request Update
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="font-medium gap-1.5"
                    disabled={isSubmitting || teacherStatus === "REJECTED" || teacherStatus === "PUBLISHED"}
                    onClick={() => handleQuickStatusChange("REJECTED")}
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>

              {/* Comprehensive editing form */}
              <form onSubmit={handleSaveChanges} className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b">
                  <h3 className="font-semibold text-sm text-foreground">
                    Detailed Corrections
                  </h3>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="detail-is-public" className="text-xs font-semibold cursor-pointer">
                      Public Visibility
                    </Label>
                    <Switch
                      id="detail-is-public"
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Teacher Review Status</Label>
                    <Select
                      value={teacherStatus}
                      onValueChange={setTeacherStatus}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UPLOADED">Uploaded</SelectItem>
                        <SelectItem value="ACCEPTED">Accepted</SelectItem>
                        <SelectItem value="UPDATE">Update Needed</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="PUBLISHED">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Journal Status</Label>
                    <Select
                      value={journalStatus}
                      onValueChange={setJournalStatus}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUBMITTED">Submitted</SelectItem>
                        <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="PUBLISHED">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {teacherStatus === "UPDATE" && (
                  <div className="space-y-1.5 border border-amber-200 dark:border-amber-900 bg-amber-500/5 p-3 rounded-lg">
                    <Label htmlFor="detail-update-comment" className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      Reason for Update Request (Required)
                    </Label>
                    <Textarea
                      id="detail-update-comment"
                      value={updateComment}
                      onChange={(e) => setUpdateComment(e.target.value)}
                      placeholder="Specify the corrections needed..."
                      disabled={isSubmitting}
                      required
                      className="min-h-[80px]"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="detail-title" className="text-xs">Paper Title</Label>
                  <Input
                    id="detail-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isSubmitting}
                    required
                    className="h-9"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="detail-journal-name" className="text-xs">Journal Name</Label>
                    <Input
                      id="detail-journal-name"
                      value={journalName}
                      onChange={(e) => setJournalName(e.target.value)}
                      disabled={isSubmitting}
                      required
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="detail-publisher" className="text-xs">Publisher</Label>
                    <Input
                      id="detail-publisher"
                      value={publisher}
                      onChange={(e) => setPublisher(e.target.value)}
                      disabled={isSubmitting}
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="detail-doi" className="text-xs">DOI</Label>
                    <Input
                      id="detail-doi"
                      value={doi}
                      onChange={(e) => setDoi(e.target.value)}
                      disabled={isSubmitting}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="detail-paper-link" className="text-xs">Paper Link</Label>
                    <Input
                      id="detail-paper-link"
                      value={paperLink}
                      onChange={(e) => setPaperLink(e.target.value)}
                      disabled={isSubmitting}
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Indexing</Label>
                    <Select
                      value={indexing}
                      onValueChange={setIndexing}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SCOPUS">Scopus</SelectItem>
                        <SelectItem value="WEB_OF_SCIENCE">Web of Science</SelectItem>
                        <SelectItem value="SCI">SCI</SelectItem>
                        <SelectItem value="SCIE">SCIE</SelectItem>
                        <SelectItem value="SSCI">SSCI</SelectItem>
                        <SelectItem value="AHCI">AHCI</SelectItem>
                        <SelectItem value="UGC_CARE">UGC Care</SelectItem>
                        <SelectItem value="DOAJ">DOAJ</SelectItem>
                        <SelectItem value="PUBMED">PubMed</SelectItem>
                        <SelectItem value="IEEE_XPLORE">IEEE Xplore</SelectItem>
                        <SelectItem value="NONE">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Quartile</Label>
                    <Select
                      value={quartile}
                      onValueChange={setQuartile}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Q1">Q1</SelectItem>
                        <SelectItem value="Q2">Q2</SelectItem>
                        <SelectItem value="Q3">Q3</SelectItem>
                        <SelectItem value="Q4">Q4</SelectItem>
                        <SelectItem value="NOT_APPLICABLE">N/A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="detail-impact-factor" className="text-xs">Impact Factor</Label>
                    <Input
                      id="detail-impact-factor"
                      type="number"
                      step="0.001"
                      value={impactFactor}
                      onChange={(e) => setImpactFactor(e.target.value)}
                      disabled={isSubmitting}
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Scope</Label>
                    <Select
                      value={scope}
                      onValueChange={setScope}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INTERNATIONAL">International</SelectItem>
                        <SelectItem value="NATIONAL">National</SelectItem>
                        <SelectItem value="REGIONAL">Regional</SelectItem>
                        <SelectItem value="LOCAL">Local</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Review Type</Label>
                    <Select
                      value={reviewType}
                      onValueChange={setReviewType}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PEER_REVIEWED">Peer Reviewed</SelectItem>
                        <SelectItem value="DOUBLE_BLIND">Double Blind</SelectItem>
                        <SelectItem value="SINGLE_BLIND">Single Blind</SelectItem>
                        <SelectItem value="EDITORIAL_REVIEWED">Editorial Reviewed</SelectItem>
                        <SelectItem value="NON_PEER_REVIEWED">Non Peer Reviewed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Access Type</Label>
                    <Select
                      value={accessType}
                      onValueChange={setAccessType}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN_ACCESS">Open Access</SelectItem>
                        <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                        <SelectItem value="HYBRID">Hybrid</SelectItem>
                        <SelectItem value="DIAMOND_OPEN_ACCESS">Diamond Open Access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Publication Mode</Label>
                    <Select
                      value={publicationMode}
                      onValueChange={setPublicationMode}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ONLINE">Online</SelectItem>
                        <SelectItem value="PRINT">Print</SelectItem>
                        <SelectItem value="PRINT_AND_ONLINE">Print & Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="detail-pub-date" className="text-xs">Publication Date</Label>
                    <Input
                      id="detail-pub-date"
                      type="date"
                      value={publicationDate}
                      onChange={(e) => setPublicationDate(e.target.value)}
                      disabled={isSubmitting}
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="detail-fees" className="text-xs">Registration Fees (₹)</Label>
                    <Input
                      id="detail-fees"
                      type="number"
                      value={registrationFees}
                      onChange={(e) => setRegistrationFees(e.target.value)}
                      disabled={isSubmitting}
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="detail-reimbursement" className="text-xs">Reimbursement (₹)</Label>
                    <Input
                      id="detail-reimbursement"
                      type="number"
                      value={reimbursement}
                      onChange={(e) => setReimbursement(e.target.value)}
                      disabled={isSubmitting}
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="detail-serial-no" className="text-xs">Serial No</Label>
                    <Input
                      id="detail-serial-no"
                      value={serialNo}
                      onChange={(e) => setSerialNo(e.target.value)}
                      disabled={isSubmitting}
                      className="h-9"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="detail-keywords" className="text-xs">Keywords (comma separated)</Label>
                    <Input
                      id="detail-keywords"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      disabled={isSubmitting}
                      placeholder="e.g. machine learning, blockchain"
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="detail-abstract" className="text-xs">Abstract</Label>
                  <Textarea
                    id="detail-abstract"
                    value={abstract}
                    onChange={(e) => setAbstract(e.target.value)}
                    disabled={isSubmitting}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
    <Dialog open={isUpdateCommentDialogOpen} onOpenChange={setIsUpdateCommentDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reason for Update Request</DialogTitle>
          <DialogDescription>
            Provide detailed feedback on what changes the student co-author needs to make.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            id="quick-update-comment"
            placeholder="E.g., Please fix the publication date and provide a valid DOI link."
            value={updateComment}
            onChange={(e) => setUpdateComment(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              setIsUpdateCommentDialogOpen(false);
              setUpdateComment("");
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirmQuickUpdate}>
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
