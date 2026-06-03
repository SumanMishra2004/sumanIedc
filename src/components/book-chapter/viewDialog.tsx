"use client"

import * as React from "react"
import Image from "next/image"
import { 
  BookOpen, 
  Calendar, 
  Building2, 
  FileText, 
  ExternalLink,
  Download,
  Users,
  GraduationCap,
  Tag,
  Globe,
  DollarSign,
  Hash,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquare
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge as LucideBadge } from "lucide-react" // For inline badges

import type { BookChapter } from "@/types/book-chapter"
import { getBookChapterById } from "@/lib/research/bookChapterApi"
import { motion } from "motion/react"

interface BookChapterViewDialogProps {
  chapterId: string | null
  open: boolean
  setOpen: (open: boolean) => void
  setViewingChapterId: (id: string | null) => void
}

export function BookChapterViewDialog({
  chapterId,
  open,
  setOpen,
  setViewingChapterId,
}: BookChapterViewDialogProps) {
  const [chapter, setChapter] = React.useState<BookChapter | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [coverImageLoading, setCoverImageLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open || !chapterId) return

    const fetchChapter = async () => {
      setLoading(true)
      setCoverImageLoading(true)
      setError(null)

      try {
        const response = await getBookChapterById(chapterId)

        if (!response.data?.bookChapter) {
          setError("Unable to load book chapter")
          setLoading(false)
          return
        }

        setChapter(response.data.bookChapter)
      } catch (err) {
        setError("Failed to fetch book chapter details")
      } finally {
        setLoading(false)
      }
    }

    fetchChapter()
  }, [open, chapterId])

  const handleClose = () => {
    setOpen(false)
    setViewingChapterId(null)
    setChapter(null)
    setError(null)
  }

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={handleClose} modal>
        <DialogContent className="max-w-7xl! max-h-[95vh] p-0 bg-card text-card-foreground border-border shadow-2xl flex flex-col">
          {/* Enhanced Header with Gradient & Controls */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm border-b border-border/50 sticky top-0 z-20 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-3xl font-bold leading-tight bg-gradient-to-r from-foreground to-primary/80 bg-clip-text text-transparent">
                  {loading ? "Loading..." : error ? "Error" : chapter?.title || "Untitled Book Chapter"}
                </DialogTitle>
                
                {chapter && (
                  <div className="flex flex-wrap items-center gap-2 mt-4 animate-fade-in">
                    {chapter.isPublic && (
                      <Badge className="bg-gradient-to-r from-chart-3 to-accent text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200">
                        <Globe className="w-4 h-4 mr-1" />
                        Public
                      </Badge>
                    )}
                    {chapter.bookChapterStatus && (
                      <Badge 
                        variant="outline" 
                        className="border-2 border-chart-1/50 backdrop-blur-sm shadow-md hover:shadow-lg"
                      >
                        {chapter.bookChapterStatus}
                      </Badge>
                    )}
                    {chapter.teacherStatus && (
                      <Badge className="bg-gradient-to-r from-chart-4 to-muted text-primary-foreground shadow-lg">
                        {chapter.teacherStatus}
                      </Badge>
                    )}
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
                      <Button onClick={() => window.location.reload()} className="w-full">
                        Retry
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {chapter && (
                <div className="space-y-8 max-w-6xl mx-auto">
                  {chapter.updateComment && (
                    <div className="bg-amber-500/5 border-2 border-dashed border-amber-500/20 text-amber-800 p-4 rounded-xl flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-sm text-amber-700">Revision Requested by Reviewer</h4>
                        <p className="text-xs font-semibold mt-1 leading-relaxed whitespace-pre-wrap">{chapter.updateComment}</p>
                      </div>
                    </div>
                  )}

                  {/* Hero Section with Poster & Actions */}
                  <section className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
                    {/* Enhanced Poster */}
                    <div className="xl:col-span-1">
                      <div className="group relative aspect-[3/4] rounded-3xl overflow-hidden border-4 border-primary/20 bg-gradient-to-br from-card/50 to-muted shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
                        {chapter.imageUrl ? (
                          <>
                            {coverImageLoading && (
                              <div className="absolute inset-0 bg-muted/80 animate-pulse" />
                            )}
                            <Image
                              src={chapter.imageUrl}
                              alt={`${chapter.title} Poster`}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-700"
                              priority
                              onLoad={() => setCoverImageLoading(false)}
                              onError={() => setCoverImageLoading(false)}
                            />
                          </>
                        ) : (
                          <div className="flex h-full items-center justify-center flex-col gap-4 text-muted-foreground bg-gradient-to-br from-muted/50 to-card">
                            <BookOpen className="w-20 h-20 opacity-30 animate-pulse" />
                            <div className="text-center">
                              <p className="text-lg font-medium">No Poster</p>
                              <p className="text-sm opacity-75">Available</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Poster Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>

                      {/* Glassmorphism Action Sheet */}
                     
                      {/* Keywords & Quick Select (responsive + conditional) */}
{chapter && (
  (() => {
    const hasActions =
      Boolean(chapter.doi) ||
      Boolean(chapter.documentUrl) ||
      (chapter.keywords?.length ?? 0) > 0

    if (!hasActions) return null

    return (
      <div className="mt-6 space-y-4">

        {/* Keywords */}
        {chapter.keywords?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chapter.keywords.slice(0, 6).map((keyword, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="
                  px-3 py-1 text-xs font-medium
                  cursor-pointer
                  hover:bg-accent/10 hover:border-accent
                  transition-all
                "
                onClick={() => navigator.clipboard.writeText(keyword)}
              >
                #{keyword}
              </Badge>
            ))}

            {chapter.keywords.length > 6 && (
              <Badge
                variant="secondary"
                className="text-xs whitespace-nowrap"
              >
                +{chapter.keywords.length - 6} more
              </Badge>
            )}
          </div>
        )}

        {/* Quick Select Actions */}
        <div
          className="
            flex flex-col gap-2
            sm:flex-row sm:flex-wrap
          "
        >
          {chapter.doi && (
            <Button
              size="sm"
              variant="outline"
              className="
                w-full sm:w-auto
                justify-start
              "
              onClick={() =>
                window.open(`https://doi.org/${chapter.doi}`, "_blank")
              }
            >
              <ExternalLink className="w-4 h-4 mr-2 shrink-0" />
              <span className="truncate">Open DOI</span>
            </Button>
          )}

          {chapter.documentUrl && (
            <Button
              size="sm"
              variant="outline"
              className="
                w-full sm:w-auto
                justify-start
              "
              onClick={() =>
                chapter.documentUrl && window.open(chapter.documentUrl, "_blank")
              }
            >
              <FileText className="w-4 h-4 mr-2 shrink-0" />
              <span className="truncate">View PDF</span>
            </Button>
          )}
        </div>
      </div>
    )
  })()
)}

                    </div>

                    {/* Enhanced Content Area */}
                    <div className="xl:col-span-3 space-y-8">
                      {/* Abstract - Glass Card */}
                      {chapter.abstract && (
                        <Card className="border-0 bg-gradient-to-br from-card/80 via-card to-muted/30 backdrop-blur-xl shadow-2xl hover:shadow-3xl transition-all duration-300 border-primary/20">
                          <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-chart-1/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-primary/30">
                                <FileText className="w-6 h-6 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                                  Abstract
                                </CardTitle>
                                <CardDescription className="text-muted-foreground">
                                  Summary of the chapter
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap max-w-4xl">
                              {chapter.abstract}
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Publication Details - Enhanced Grid */}
                      {(chapter.publisher || chapter.publicationDate || chapter.doi || 
                        chapter.isbnIssn || chapter.registrationFees || chapter.reimbursement) && (
                        <Card className="border-0 bg-gradient-to-br from-card/80 via-card to-muted/30 backdrop-blur-xl shadow-2xl hover:shadow-3xl transition-all duration-300 border-secondary/20">
                          <CardHeader className="pb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-chart-2/20 to-accent/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-chart-2/30">
                                <BookOpen className="w-6 h-6 text-chart-2" />
                              </div>
                              <div>
                                <CardTitle className="text-xl font-bold flex items-center gap-2">
                                  Publication Details
                                </CardTitle>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {chapter.publisher && (
                                <DetailItem
                                  icon={<Building2 className="w-5 h-5 text-chart-2" />}
                                  label="Publisher"
                                  value={chapter.publisher}
                                />
                              )}
                              {chapter.publicationDate && (
                                <DetailItem
                                  icon={<Calendar className="w-5 h-5 text-chart-3" />}
                                  label="Published"
                                  value={new Date(chapter.publicationDate).toLocaleDateString("en-IN", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                />
                              )}
                              {chapter.doi && (
                                <DetailItem
                                  icon={<Hash className="w-5 h-5 text-primary" />}
                                  label="DOI"
                                  value={chapter.doi}
                                  className="lg:col-span-2"
                                  onClick={() => window.open(`https://doi.org/${chapter.doi}`, "_blank")}
                                />
                              )}
                              {chapter.isbnIssn && (
                                <DetailItem
                                  icon={<Hash className="w-5 h-5 text-chart-4" />}
                                  label="ISBN/ISSN"
                                  value={chapter.isbnIssn}
                                />
                              )}
                              {chapter.registrationFees !== null && chapter.registrationFees !== undefined && (
                                <DetailItem
                                  icon={<DollarSign className="w-5 h-5 text-destructive" />}
                                  label="Registration Fees"
                                  value={`₹${chapter.registrationFees.toLocaleString('en-IN')}`}
                                />
                              )}
                              {chapter.reimbursement !== null && chapter.reimbursement !== undefined && (
                                <DetailItem
                                  icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
                                  label="Reimbursement"
                                  value={`₹${chapter.reimbursement.toLocaleString('en-IN')}`}
                                />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                  
                    </div>
                  </section>

                  {/* Enhanced Authors Section */}
                  {(chapter.facultyAuthors?.length > 0 || chapter.studentAuthors?.length > 0) && (
                    <section>
                      <Card className="border-0 bg-gradient-to-br from-card/80 via-card to-muted/30 backdrop-blur-xl shadow-2xl hover:shadow-3xl transition-all duration-300 border-chart-4/20">
                        <CardHeader className="pb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-chart-4/20 to-secondary/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-chart-4/30">
                              <Users className="w-6 h-6 text-chart-4" />
                            </div>
                            <div>
                              <CardTitle className="text-xl font-bold">
                                Authors ({(chapter.facultyAuthors?.length || 0) + (chapter.studentAuthors?.length || 0)})
                              </CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {chapter.facultyAuthors?.length > 0 && (
                              <AuthorList
                                title="Faculty Authors"
                                icon={<Users className="w-5 h-5" />}
                                authors={chapter.facultyAuthors}
                              />
                            )}
                            {chapter.studentAuthors?.length > 0 && (
                              <AuthorList
                                title="Student Authors"
                                icon={<GraduationCap className="w-5 h-5" />}
                                authors={chapter.studentAuthors}
                              />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </section>
                  )}

                  {/* Enhanced PDF Preview */}
                  {chapter.documentUrl && (
                    <section>
                      <Card className="border-0 bg-gradient-to-br from-card/80 via-card to-muted/30 backdrop-blur-xl shadow-2xl hover:shadow-3xl transition-all duration-300 border-chart-3/20">
                        <CardHeader className="pb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-chart-3/20 to-accent/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-chart-3/30">
                              <FileText className="w-6 h-6 text-chart-3" />
                            </div>
                            <div>
                              <CardTitle className="text-xl font-bold">Document Preview</CardTitle>
                              <CardDescription>Interactive PDF viewer</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="aspect-video max-h-[70vh] w-full rounded-3xl overflow-hidden border-4 border-muted/50 shadow-2xl mx-auto max-w-4xl">
                            <iframe
                              src={`${chapter.documentUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                              className="w-full h-full"
                              title={`${chapter.title} PDF Preview`}
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

// Enhanced Detail Item with Clickable DOI
function DetailItem({
  icon,
  label,
  value,
  className = "",
  onClick
}: {
  icon: React.ReactNode
  label: string
  value: string
  className?: string
  onClick?: () => void
}) {
  return (
    <div 
      className={`group space-y-1.5 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-default hover:cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground/80 group-hover:text-foreground transition-colors">
        <div className="w-9 h-9 bg-gradient-to-br from-muted/50 to-card rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-all duration-200">
          {icon}
        </div>
        <span>{label}</span>
      </div>
      <p className="text-lg font-bold text-foreground truncate pl-12">{value}</p>
    </div>
  )
}

// Enhanced Author List with Animations
function AuthorList({
  title,
  icon,
  authors,
}: {
  title: string
  icon: React.ReactNode
  authors: { id: string; user: { name: string | null; email: string | null; image?: string | null } }[]
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-base font-bold flex items-center gap-3 text-foreground/90 bg-gradient-to-r from-card via-card/50 to-muted/30 px-4 py-3 rounded-2xl backdrop-blur-sm border border-border/50">
        {icon}
        {title} ({authors.length})
      </h4>
      <div className="space-y-3">
        {authors.map((author, index) => (
          <motion.div
            key={author.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-accent/10 hover:to-primary/5 border border-transparent hover:border-accent/30 transition-all duration-300 hover:shadow-md hover:-translate-y-1"
          >
            <div className="relative flex-shrink-0">
              {author.user?.image ? (
                <Avatar className="w-14 h-14 ring-2 ring-background/50 group-hover:ring-accent/50 transition-all duration-300 shadow-lg">
                  <AvatarImage src={author.user.image} alt={author.user?.name || "Author"} />
                  <AvatarFallback className="w-14 h-14 text-lg font-bold bg-gradient-to-br from-primary to-chart-1 text-primary-foreground">
                    {author.user?.name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-muted to-card flex items-center justify-center ring-2 ring-background/50 group-hover:ring-accent/50 shadow-lg transition-all duration-300">
                  <span className="text-lg font-bold text-muted-foreground">
                    {author.user?.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold truncate group-hover:text-accent transition-colors">
                {author.user?.name || "Unknown Author"}
              </p>
              {author.user?.email && (
                <p className="text-sm text-muted-foreground truncate max-w-[250px]">
                  {author.user.email}
                </p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 ml-auto" />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Enhanced Skeleton with Better Animations
function DialogSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <Skeleton className="aspect-[3/4] w-full rounded-3xl" />
        <div className="xl:col-span-3 space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4 rounded-2xl" />
            <Skeleton className="h-6 w-1/2 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
      <Skeleton className="h-80 rounded-3xl" />
    </div>
  )
}
