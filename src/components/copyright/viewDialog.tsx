"use client"

import * as React from "react"
import Image from "next/image"
import { 
  Shield, 
  Calendar, 
  FileText, 
  ExternalLink,
  Users,
  GraduationCap,
  Globe,
  DollarSign,
  Hash,
  X,
  ChevronRight,
  Loader2,
  TrendingUp,
  Award,
  CheckCircle,
  FileDown,
  AlertCircle
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"

import type { Copyright } from "@/types/copyright"
import { getCopyrightById } from "@/lib/research/copyrightApi"
import { motion } from "motion/react"

interface CopyrightViewDialogProps {
  copyrightId: string | null
  open: boolean
  setOpen: (open: boolean) => void
  setViewingCopyrightId: (id: string | null) => void
}

export function CopyrightViewDialog({
  copyrightId,
  open,
  setOpen,
  setViewingCopyrightId,
}: CopyrightViewDialogProps) {
  const [copyright, setCopyright] = React.useState<Copyright | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [coverImageLoading, setCoverImageLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open || !copyrightId) return

    const fetchCopyright = async () => {
      setLoading(true)
      setCoverImageLoading(true)
      setError(null)

      try {
        const response = await getCopyrightById(copyrightId)

        if (!response.data?.copyright) {
          setError("Unable to load copyright details")
          setLoading(false)
          return
        }

        setCopyright(response.data.copyright)
      } catch (err) {
        setError("Failed to fetch copyright details")
      } finally {
        setLoading(false)
      }
    }

    fetchCopyright()
  }, [open, copyrightId])

  const handleClose = () => {
    setOpen(false)
    setViewingCopyrightId(null)
    setCopyright(null)
    setError(null)
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "APPROVED":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "UNDER_REVIEW":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      default:
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
    }
  }

  const getTeacherBadgeColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
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
    <TooltipProvider>
      <Dialog open={open} onOpenChange={handleClose} modal>
        <DialogContent className="max-w-7xl! max-h-[95vh] p-0 bg-card text-card-foreground border-border shadow-2xl flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm border-b border-border/50 sticky top-0 z-20 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-3xl font-bold leading-tight bg-gradient-to-r from-foreground to-primary/80 bg-clip-text text-transparent">
                  {loading ? "Loading..." : error ? "Error" : copyright?.title || "Untitled Copyright"}
                </DialogTitle>
                
                {copyright && (
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    {copyright.isPublic && (
                      <Badge className="bg-gradient-to-r from-chart-3 to-accent text-primary-foreground shadow-lg">
                        <Globe className="w-4 h-4 mr-1" />
                        Publicly Visible
                      </Badge>
                    )}
                    <Badge variant="outline" className={`border-2 font-medium ${getStatusBadgeColor(copyright.copyrightStatus)}`}>
                      Copyright: {copyright.copyrightStatus}
                    </Badge>
                    <Badge variant="outline" className={`border-2 font-medium ${getTeacherBadgeColor(copyright.teacherStatus)}`}>
                      Verification: {copyright.teacherStatus}
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 w-9 p-0 hover:bg-accent/50"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <ScrollArea className="flex-1 px-6 py-8 scrollbar-gradient">
              {loading && <DialogSkeleton />}

              {error && (
                <div className="flex items-center justify-center h-96">
                  <Card className="w-full max-w-md border-destructive/50 backdrop-blur-sm">
                    <CardContent className="pt-8 pb-6 text-center">
                      <Loader2 className="w-12 h-12 text-destructive mx-auto mb-4 animate-spin" />
                      <h3 className="text-lg font-semibold text-destructive mb-2">Load Failed</h3>
                      <p className="text-sm text-muted-foreground mb-6">{error}</p>
                      <Button onClick={handleClose} className="w-full">
                        Close
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {copyright && (
                <div className="space-y-8 max-w-6xl mx-auto">
                  {/* Grid Hero */}
                  <section className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
                    {/* Cover Image */}
                    <div className="xl:col-span-1">
                      <div className="group relative aspect-[3/4] rounded-3xl overflow-hidden border-4 border-primary/20 bg-gradient-to-br from-card/50 to-muted shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
                        {copyright.imageUrl ? (
                          <>
                            {coverImageLoading && (
                              <div className="absolute inset-0 bg-muted/80 animate-pulse" />
                            )}
                            <Image
                              src={copyright.imageUrl}
                              alt={`${copyright.title} cover`}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-700"
                              priority
                              onLoad={() => setCoverImageLoading(false)}
                              onError={() => setCoverImageLoading(false)}
                            />
                          </>
                        ) : (
                          <div className="flex h-full items-center justify-center flex-col gap-4 text-muted-foreground bg-gradient-to-br from-muted/50 to-card">
                            <Shield className="w-20 h-20 opacity-30" />
                            <div className="text-center">
                              <p className="text-lg font-medium">No Image</p>
                              <p className="text-sm opacity-75">Available</p>
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>

                      {/* Quick Actions */}
                      <div className="mt-6 flex flex-col gap-2">
                        {copyright.documentUrl && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full justify-start text-xs"
                            onClick={() => window.open(copyright.documentUrl || "", "_blank")}
                          >
                            <FileDown className="w-3.5 h-3.5 mr-2 shrink-0" />
                            <span>Download PDF Evidence</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Metadata Content */}
                    <div className="xl:col-span-3 space-y-6">
                      {/* Reviewer Feedback Card */}
                      {copyright.updateComment && (
                        <Card className="border border-amber-500/20 bg-amber-500/5 backdrop-blur-xl shadow-lg">
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                                <AlertCircle className="w-5 h-5 text-amber-500" />
                              </div>
                              <div>
                                <CardTitle className="text-lg font-bold text-amber-700 dark:text-amber-400">Corrections Requested</CardTitle>
                                <CardDescription className="text-xs text-amber-600/80 dark:text-amber-400/80">Feedback from verification reviewer</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm md:text-base leading-relaxed text-amber-800 dark:text-amber-300 whitespace-pre-wrap bg-amber-500/10 p-3 rounded-lg border border-dashed border-amber-500/30">
                              {copyright.updateComment}
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Abstract Card */}
                      {copyright.abstract && (
                        <Card className="border-0 bg-gradient-to-br from-card/85 via-card to-muted/20 backdrop-blur-xl shadow-lg border-primary/10">
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                                <FileText className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-lg font-bold">Abstract</CardTitle>
                                <CardDescription className="text-xs">Summary of the copyright</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm md:text-base leading-relaxed text-foreground/80 whitespace-pre-wrap">
                              {copyright.abstract}
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Detail Metrics Grid */}
                      <Card className="border-0 bg-gradient-to-br from-card/85 via-card to-muted/20 backdrop-blur-xl shadow-lg border-secondary/10">
                        <CardHeader className="pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-secondary/20 rounded-xl flex items-center justify-center border border-secondary/30">
                              <Shield className="w-5 h-5 text-secondary" />
                            </div>
                            <CardTitle className="text-lg font-bold">Copyright Details</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <DetailCell
                              icon={<Hash className="w-4 h-4 text-primary" />}
                              label="Registration Number"
                              value={copyright.regNo || "—"}
                            />
                            <DetailCell
                              icon={<Calendar className="w-4 h-4 text-indigo-400" />}
                              label="Filing Date"
                              value={
                                copyright.dateOfFiling
                                  ? new Date(copyright.dateOfFiling).toLocaleDateString("en-IN", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })
                                  : "—"
                              }
                            />
                            <DetailCell
                              icon={<Calendar className="w-4 h-4 text-indigo-400" />}
                              label="Submission Date"
                              value={
                                copyright.dateOfSubmission
                                  ? new Date(copyright.dateOfSubmission).toLocaleDateString("en-IN", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })
                                  : "—"
                              }
                            />
                            <DetailCell
                              icon={<Calendar className="w-4 h-4 text-indigo-400" />}
                              label="Published Date"
                              value={
                                copyright.dateOfPublished
                                  ? new Date(copyright.dateOfPublished).toLocaleDateString("en-IN", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })
                                  : "—"
                              }
                            />
                            <DetailCell
                              icon={<Award className="w-4 h-4 text-yellow-400" />}
                              label="Grant Date"
                              value={
                                copyright.dateOfGrant
                                  ? new Date(copyright.dateOfGrant).toLocaleDateString("en-IN", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })
                                  : "—"
                              }
                            />
                            {copyright.registrationFees !== null && (
                              <DetailCell
                                icon={<DollarSign className="w-4 h-4 text-red-400" />}
                                label="Registration Fees"
                                value={`₹${copyright.registrationFees.toLocaleString("en-IN")}`}
                              />
                            )}
                            {copyright.reimbursement !== null && (
                              <DetailCell
                                icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
                                label="Reimbursement"
                                value={`₹${copyright.reimbursement.toLocaleString("en-IN")}`}
                              />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </section>

                  {/* Authors lists */}
                  <section>
                    <Card className="border-0 bg-gradient-to-br from-card/85 via-card to-muted/20 backdrop-blur-xl shadow-lg">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                            <Users className="w-5 h-5 text-purple-400" />
                          </div>
                          <CardTitle className="text-lg font-bold">Authors</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {copyright.facultyAuthors?.length > 0 && (
                            <AuthorSection
                              title="Faculty Authors"
                              icon={<Users className="w-4 h-4" />}
                              authors={copyright.facultyAuthors}
                            />
                          )}
                          {copyright.studentAuthors?.length > 0 && (
                            <AuthorSection
                              title="Student Authors"
                              icon={<GraduationCap className="w-4 h-4" />}
                              authors={copyright.studentAuthors}
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </section>

                  {/* PDF Document Preview */}
                  {copyright.documentUrl && (
                    <section>
                      <Card className="border-0 bg-gradient-to-br from-card/85 via-card to-muted/20 backdrop-blur-xl shadow-lg">
                        <CardHeader className="pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                              <FileText className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-bold">Document Preview</CardTitle>
                              <CardDescription className="text-xs">Interactive PDF viewer</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="aspect-video max-h-[70vh] w-full rounded-2xl overflow-hidden border border-muted bg-neutral-900 shadow-lg mx-auto max-w-4xl">
                            <iframe
                              src={`${copyright.documentUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                              className="w-full h-full"
                              title={`${copyright.title} PDF Evidence`}
                              loading="lazy"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </section>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}

function DetailCell({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: string
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
    >
      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
          {label}
        </span>
        <span className="text-sm font-bold text-foreground truncate block">
          {value}
        </span>
      </div>
    </div>
  )
}

function AuthorSection({
  title,
  icon,
  authors,
}: {
  title: string
  icon: React.ReactNode
  authors: { id: string; user: { name: string | null; email: string | null; image?: string | null; department?: string | null } }[]
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold flex items-center gap-2 text-foreground/80 border-b pb-2">
        {icon}
        {title}
      </h4>
      <div className="space-y-2">
        {authors.map((author, index) => (
          <motion.div
            key={author.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:border-primary/20 hover:bg-muted/30 transition-all duration-200"
          >
            {author.user?.image ? (
              <Avatar className="w-10 h-10 shadow-sm border border-border/50">
                <AvatarImage src={author.user.image} alt={author.user?.name || "Author"} />
                <AvatarFallback className="text-sm font-bold bg-primary text-primary-foreground">
                  {author.user?.name?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-muted to-card border border-border/50 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-muted-foreground">
                  {author.user?.name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate leading-none mb-1">
                {author.user?.name || "Unknown Author"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {author.user?.email || "No email"} {author.user?.department ? `• ${author.user.department}` : ""}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function DialogSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-6xl mx-auto">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
        <div className="xl:col-span-3 space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4 rounded-xl" />
            <Skeleton className="h-4 w-1/2 rounded-lg" />
          </div>
          <Skeleton className="h-40 rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
