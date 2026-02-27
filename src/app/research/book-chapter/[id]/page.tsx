"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import {
  BookOpen,
  Calendar,
  Building2,
  FileText,
  ExternalLink,
  Users,
  GraduationCap,
  Hash,
  Globe,
  DollarSign,
  ArrowLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react"
import { motion } from "motion/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { getBookChapterById } from "@/lib/research/bookChapterApi"
import type { BookChapter } from "@/types/book-chapter"

export default function BookChapterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [chapter, setChapter] = useState<BookChapter | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetch = async () => {
      setLoading(true)
      setError(null)
      const res = await getBookChapterById(id)
      if (res.data?.bookChapter) {
        setChapter(res.data.bookChapter)
      } else {
        setError(res.error ?? "Unable to load book chapter.")
      }
      setLoading(false)
    }

    fetch()
  }, [id])

  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation bar */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 md:px-8 py-3 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="h-4 w-px bg-border" />
        <span className="text-sm text-muted-foreground font-medium">Book Chapter Detail</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* ─── Loading ─── */}
        {loading && <PageSkeleton />}

        {/* ─── Error ─── */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground mb-2">Failed to Load</h2>
              <p className="text-muted-foreground max-w-sm">{error}</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => window.location.reload()}>Retry</Button>
              <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
            </div>
          </div>
        )}

        {/* ─── Content ─── */}
        {!loading && chapter && (
          <div className="space-y-10">
            {/* ── Hero ── */}
            <section className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
              {/* Poster */}
              <div className="xl:col-span-1">
                <div className="group relative aspect-[3/4] rounded-3xl overflow-hidden border-4 border-primary/20 bg-gradient-to-br from-card/50 to-muted shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-1">
                  {chapter.imageUrl ? (
                    <Image
                      src={chapter.imageUrl}
                      alt={chapter.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                      priority
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground bg-gradient-to-br from-muted/50 to-card">
                      <BookOpen className="w-20 h-20 opacity-30 animate-pulse" />
                      <div className="text-center">
                        <p className="text-lg font-medium">No Cover</p>
                        <p className="text-sm opacity-75">Available</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Keywords & Quick Actions */}
                {(chapter.keywords?.length > 0 || chapter.doi || chapter.documentUrl) && (
                  <div className="mt-6 space-y-4">
                    {chapter.keywords?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {chapter.keywords.slice(0, 6).map((kw, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="px-3 py-1 text-xs cursor-pointer hover:bg-accent/10 hover:border-accent transition-all"
                            onClick={() => navigator.clipboard.writeText(kw)}
                          >
                            #{kw}
                          </Badge>
                        ))}
                        {chapter.keywords.length > 6 && (
                          <Badge variant="secondary" className="text-xs">
                            +{chapter.keywords.length - 6} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      {chapter.doi && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="justify-start"
                          onClick={() => window.open(`https://doi.org/${chapter.doi}`, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open DOI
                        </Button>
                      )}
                      {chapter.documentUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="justify-start"
                          onClick={() => window.open(chapter.documentUrl!, "_blank")}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          View PDF
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Main info */}
              <div className="xl:col-span-3 space-y-8">
                {/* Title & Badges */}
                <div className="space-y-4">
                  <h1 className="text-3xl md:text-4xl font-bold leading-tight bg-gradient-to-r from-foreground to-primary/80 bg-clip-text text-transparent">
                    {chapter.title}
                  </h1>
                  <div className="flex flex-wrap gap-2">
                    {chapter.isPublic && (
                      <Badge className="bg-gradient-to-r from-chart-3 to-accent text-primary-foreground shadow">
                        <Globe className="w-3.5 h-3.5 mr-1" />
                        Public
                      </Badge>
                    )}
                    {chapter.bookChapterStatus && (
                      <Badge variant="outline" className="border-2 border-chart-1/50">
                        {chapter.bookChapterStatus}
                      </Badge>
                    )}
                    {chapter.teacherStatus && (
                      <Badge className="bg-gradient-to-r from-chart-4 to-muted text-primary-foreground">
                        {chapter.teacherStatus}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Abstract */}
                {chapter.abstract && (
                  <Card className="border-0 bg-gradient-to-br from-card/80 via-card to-muted/30 backdrop-blur-xl shadow-xl border-primary/20">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-chart-1/20 rounded-2xl flex items-center justify-center border border-primary/30">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold">Abstract</CardTitle>
                          <CardDescription>Summary of the chapter</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
                        {chapter.abstract}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Publication Details */}
                {(chapter.publisher ||
                  chapter.publicationDate ||
                  chapter.doi ||
                  chapter.isbnIssn ||
                  chapter.registrationFees != null ||
                  chapter.reimbursement != null) && (
                  <Card className="border-0 bg-gradient-to-br from-card/80 via-card to-muted/30 backdrop-blur-xl shadow-xl border-secondary/20">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-chart-2/20 to-accent/20 rounded-2xl flex items-center justify-center border border-chart-2/30">
                          <BookOpen className="w-5 h-5 text-chart-2" />
                        </div>
                        <CardTitle className="text-lg font-bold">Publication Details</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                            label="ISBN / ISSN"
                            value={chapter.isbnIssn}
                          />
                        )}
                        {chapter.registrationFees != null && (
                          <DetailItem
                            icon={<DollarSign className="w-5 h-5 text-destructive" />}
                            label="Registration Fees"
                            value={`₹${chapter.registrationFees.toLocaleString("en-IN")}`}
                          />
                        )}
                        {chapter.reimbursement != null && (
                          <DetailItem
                            icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
                            label="Reimbursement"
                            value={`₹${chapter.reimbursement.toLocaleString("en-IN")}`}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>

            {/* ── Authors ── */}
            {(chapter.facultyAuthors?.length > 0 || chapter.studentAuthors?.length > 0) && (
              <section>
                <Card className="border-0 bg-gradient-to-br from-card/80 via-card to-muted/30 backdrop-blur-xl shadow-xl border-chart-4/20">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-chart-4/20 to-secondary/20 rounded-2xl flex items-center justify-center border border-chart-4/30">
                        <Users className="w-5 h-5 text-chart-4" />
                      </div>
                      <CardTitle className="text-lg font-bold">
                        Authors (
                        {(chapter.facultyAuthors?.length || 0) +
                          (chapter.studentAuthors?.length || 0)}
                        )
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {chapter.facultyAuthors?.length > 0 && (
                        <AuthorList
                          title="Faculty Authors"
                          icon={<Users className="w-4 h-4" />}
                          authors={chapter.facultyAuthors}
                        />
                      )}
                      {chapter.studentAuthors?.length > 0 && (
                        <AuthorList
                          title="Student Authors"
                          icon={<GraduationCap className="w-4 h-4" />}
                          authors={chapter.studentAuthors}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* ── PDF Preview ── */}
            {chapter.documentUrl && (
              <section>
                <Card className="border-0 bg-gradient-to-br from-card/80 via-card to-muted/30 backdrop-blur-xl shadow-xl border-chart-3/20">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-chart-3/20 to-accent/20 rounded-2xl flex items-center justify-center border border-chart-3/30">
                        <FileText className="w-5 h-5 text-chart-3" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold">Document Preview</CardTitle>
                        <CardDescription>Interactive PDF viewer</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <div className="w-full rounded-2xl overflow-hidden border-2 border-muted/50 shadow-xl" style={{ height: "70vh" }}>
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
      </div>
    </div>
  )
}

/* ─── Sub-components ─────────────────────────────────────────── */

function DetailItem({
  icon,
  label,
  value,
  className = "",
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: string
  className?: string
  onClick?: () => void
}) {
  return (
    <div
      className={`group space-y-1.5 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 ${onClick ? "cursor-pointer" : "cursor-default"} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
        <div className="w-8 h-8 bg-gradient-to-br from-muted/50 to-card rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-all duration-200">
          {icon}
        </div>
        <span>{label}</span>
      </div>
      <p className="text-base font-bold text-foreground truncate pl-10">{value}</p>
    </div>
  )
}

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
    <div className="space-y-3">
      <h4 className="text-sm font-bold flex items-center gap-2 text-foreground/90 bg-gradient-to-r from-card via-card/50 to-muted/30 px-4 py-2.5 rounded-xl border border-border/50">
        {icon}
        {title} ({authors.length})
      </h4>
      <div className="space-y-2">
        {authors.map((author, index) => (
          <motion.div
            key={author.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-gradient-to-r hover:from-accent/10 hover:to-primary/5 border border-transparent hover:border-accent/30 transition-all duration-300"
          >
            {author.user?.image ? (
              <Avatar className="w-12 h-12 ring-2 ring-background/50 group-hover:ring-accent/50 transition-all shadow-md">
                <AvatarImage src={author.user.image} alt={author.user?.name || "Author"} />
                <AvatarFallback className="text-base font-bold bg-gradient-to-br from-primary to-chart-1 text-primary-foreground">
                  {author.user?.name?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-muted to-card flex items-center justify-center ring-2 ring-background/50 group-hover:ring-accent/50 shadow-md transition-all">
                <span className="text-base font-bold text-muted-foreground">
                  {author.user?.name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate group-hover:text-accent transition-colors">
                {author.user?.name || "Unknown Author"}
              </p>
              {author.user?.email && (
                <p className="text-xs text-muted-foreground truncate">{author.user.email}</p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all ml-auto" />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <Skeleton className="aspect-[3/4] w-full rounded-3xl" />
        <div className="xl:col-span-3 space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-10 w-4/5 rounded-2xl" />
            <Skeleton className="h-6 w-2/5 rounded-xl" />
          </div>
          <Skeleton className="h-52 rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
      <Skeleton className="h-72 rounded-3xl" />
      <Skeleton className="h-[60vh] rounded-3xl" />
    </div>
  )
}
