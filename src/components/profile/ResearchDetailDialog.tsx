"use client"

import Image from "next/image"
import { useState } from "react"
import {
  X,
  ExternalLink,
  FileDown,
  Calendar,
  Users,
  GraduationCap,
  FileText,
  Globe,
  Hash,
  ChevronRight,
  Eye,
  EyeOff,
  Building2,
  Tag,
  Info,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  type ResearchPostCardProps,
  typeConfig,
  statusConfig,
  formatStatus,
  formatDate,
} from "./ResearchPostCard"

interface ResearchDetailDialogProps {
  open: boolean
  onClose: () => void
  data: ResearchPostCardProps
}

function DetailCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card/80 border border-border/40 hover:border-primary/20 hover:bg-primary/5 transition-all duration-200">
      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
          {label}
        </span>
        <span className="text-sm font-bold text-foreground truncate block">{value}</span>
      </div>
    </div>
  )
}

function AuthorRow({
  title,
  icon,
  authors,
}: {
  title: string
  icon: React.ReactNode
  authors: { user: { id: string; name: string | null; image: string | null } }[]
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border/30 pb-2">
        {icon}
        {title}
      </h4>
      <div className="space-y-2">
        {authors.map((a) => {
          const initials = a.user.name
            ? a.user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
            : "?"
          return (
            <div
              key={a.user.id}
              className="flex items-center gap-3 p-2.5 rounded-xl border border-border/30 hover:border-primary/20 hover:bg-muted/20 transition-all"
            >
              <Avatar className="h-9 w-9 border border-border/40">
                <AvatarImage src={a.user.image ?? ""} alt={a.user.name ?? ""} />
                <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{a.user.name ?? "Unknown"}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ResearchDetailDialog({ open, onClose, data }: ResearchDetailDialogProps) {
  const {
    type,
    title,
    subtitle,
    abstract,
    keywords = [],
    status,
    date,
    doi,
    link,
    documentUrl,
    imageUrl,
    isPublic,
    isOwnProfile,
    studentAuthors = [],
    facultyAuthors = [],
    extras = {},
  } = data

  const cfg = typeConfig[type]
  const statusClass = status ? (statusConfig[status] ?? "bg-muted/30 text-muted-foreground") : null
  const [coverLoaded, setCoverLoaded] = useState(false)

  const validExtras = Object.entries(extras).filter(([, v]) => v)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl! max-h-[92vh] p-0 bg-card text-card-foreground border-border shadow-2xl flex flex-col overflow-hidden">
        {/* Sticky header */}
        <div className="shrink-0 px-6 pt-5 pb-4 border-b border-border/50 bg-gradient-to-r from-card via-card to-muted/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.badgeBg}`}
                >
                  {cfg.icon}
                  {cfg.label}
                </span>
                {status && statusClass && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusClass}`}>
                    {formatStatus(status)}
                  </span>
                )}
                {isOwnProfile && isPublic !== undefined && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border ${
                      isPublic
                        ? "bg-[#c9f53b]/10 text-[#c9f53b] border-[#c9f53b]/25"
                        : "bg-muted/40 text-muted-foreground border-border/30"
                    }`}
                  >
                    {isPublic ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {isPublic ? "Public" : "Private"}
                  </span>
                )}
                {date && (
                  <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(date)}
                  </span>
                )}
              </div>
              <DialogTitle className="text-xl font-bold leading-tight text-foreground">
                {title}
              </DialogTitle>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 shrink-0 text-[#c9f53b]/60" />
                  {subtitle}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="shrink-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable body */}
        <ScrollArea className="flex-1 min-h-0 scrollbar-gradient">
          <div className="p-6 space-y-6">
            {/* Hero grid: cover + quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
              {/* Cover image */}
              <div className="md:col-span-1">
                <div
                  className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-border/40 shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${cfg.color}15, transparent)` }}
                >
                  {imageUrl ? (
                    <>
                      {!coverLoaded && (
                        <div className="absolute inset-0 bg-muted/60 animate-pulse" />
                      )}
                      <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-cover"
                        onLoad={() => setCoverLoaded(true)}
                        onError={() => setCoverLoaded(true)}
                        sizes="300px"
                        priority
                      />
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center flex-col gap-3 text-muted-foreground">
                      <div
                        className="flex h-16 w-16 items-center justify-center rounded-2xl border"
                        style={{ background: `${cfg.color}18`, borderColor: `${cfg.color}30`, color: cfg.color }}
                      >
                        <span className="scale-[2.2]">{cfg.icon}</span>
                      </div>
                      <p className="text-sm font-medium" style={{ color: cfg.color }}>No Cover</p>
                    </div>
                  )}
                </div>

                {/* Action buttons below cover */}
                <div className="mt-3 flex flex-col gap-2">
                  {documentUrl && (
                    <Button
                      size="sm"
                      className="w-full gap-2 bg-[#c9f53b] hover:bg-[#c9f53b]/90 text-black font-semibold"
                      onClick={() => window.open(documentUrl, "_blank")}
                    >
                      <FileDown className="h-4 w-4" />
                      Download PDF
                    </Button>
                  )}
                  {doi && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2 text-xs border-border/50 hover:border-[#c9f53b]/40 hover:bg-[#c9f53b]/5"
                      onClick={() => window.open(`https://doi.org/${doi}`, "_blank")}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open DOI: {doi}
                    </Button>
                  )}
                  {link && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2 text-xs border-border/50 hover:border-[#c9f53b]/40 hover:bg-[#c9f53b]/5"
                      onClick={() => window.open(link, "_blank")}
                    >
                      <Globe className="h-3.5 w-3.5" />
                      View Paper
                    </Button>
                  )}
                </div>

                {/* Keywords */}
                {keywords.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="h-3 w-3" /> Keywords
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {keywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2 py-0.5 rounded-full text-[11px] font-medium border"
                          style={{
                            background: `${cfg.color}12`,
                            color: `${cfg.color}cc`,
                            borderColor: `${cfg.color}28`,
                          }}
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right side: abstract + details */}
              <div className="md:col-span-2 space-y-4">
                {/* Abstract */}
                {abstract && (
                  <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card/80 to-muted/10 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <h4 className="font-semibold text-sm">Abstract</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {abstract}
                    </p>
                  </div>
                )}

                {/* Extras / detail cells */}
                {validExtras.length > 0 && (
                  <div className="rounded-2xl border border-border/40 bg-card/80 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-secondary/20 border border-secondary/30 flex items-center justify-center">
                        <Info className="h-3.5 w-3.5 text-secondary-foreground" />
                      </div>
                      <h4 className="font-semibold text-sm">Details</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {validExtras.map(([k, v]) => (
                        <DetailCell
                          key={k}
                          icon={<Hash className="h-3.5 w-3.5 text-muted-foreground" />}
                          label={k}
                          value={String(v)}
                        />
                      ))}
                      {date && (
                        <DetailCell
                          icon={<Calendar className="h-3.5 w-3.5 text-indigo-400" />}
                          label="Date"
                          value={formatDate(date) ?? "—"}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Authors section */}
            {(facultyAuthors.length > 0 || studentAuthors.length > 0) && (
              <div className="rounded-2xl border border-border/40 bg-card/80 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Users className="h-3.5 w-3.5 text-purple-400" />
                  </div>
                  <h4 className="font-semibold text-sm">Authors</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {facultyAuthors.length > 0 && (
                    <AuthorRow
                      title="Faculty"
                      icon={<Building2 className="h-3 w-3" />}
                      authors={facultyAuthors}
                    />
                  )}
                  {studentAuthors.length > 0 && (
                    <AuthorRow
                      title="Students"
                      icon={<GraduationCap className="h-3 w-3" />}
                      authors={studentAuthors}
                    />
                  )}
                </div>
              </div>
            )}

            {/* PDF embed viewer */}
            {documentUrl && (
              <div className="rounded-2xl border border-border/40 bg-card/80 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <FileText className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Document Preview</h4>
                      <p className="text-xs text-muted-foreground">PDF Viewer</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs border-emerald-500/20 hover:bg-emerald-500/5 hover:border-emerald-500/40 text-emerald-400"
                    onClick={() => window.open(documentUrl, "_blank")}
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </div>
                <div className="aspect-video max-h-[60vh] bg-neutral-900">
                  <iframe
                    src={`${documentUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                    className="w-full h-full"
                    title={`${title} PDF`}
                    loading="lazy"
                  />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
