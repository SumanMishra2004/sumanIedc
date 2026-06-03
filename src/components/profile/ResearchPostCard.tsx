"use client"

import Image from "next/image"
import { useState } from "react"
import {
  ExternalLink,
  Calendar,
  FileDown,
  Eye,
  EyeOff,
  FileText,
  BookOpen,
  Microscope,
  ScrollText,
  Copyright,
  Award,
  GraduationCap,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ResearchDetailDialog } from "./ResearchDetailDialog"

export type ResearchType =
  | "journal"
  | "bookChapter"
  | "conference"
  | "patent"
  | "copyright"
  | "certificate"
  | "fdp"

interface Author {
  id: string
  name: string | null
  image: string | null
}

export interface ResearchPostCardProps {
  type: ResearchType
  id: string
  title: string
  subtitle?: string
  abstract?: string | null
  keywords?: string[]
  status?: string
  date?: Date | string | null
  doi?: string | null
  link?: string | null
  documentUrl?: string | null
  imageUrl?: string | null
  isPublic?: boolean
  isOwnProfile?: boolean
  studentAuthors?: { user: Author }[]
  facultyAuthors?: { user: Author }[]
  extras?: Record<string, string | null | undefined>
}

export const typeConfig: Record<
  ResearchType,
  { label: string; color: string; badgeBg: string; icon: React.ReactNode }
> = {
  journal: {
    label: "Journal",
    color: "#60a5fa",
    badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: <FileText className="h-3.5 w-3.5" />,
  },
  bookChapter: {
    label: "Book Chapter",
    color: "#a78bfa",
    badgeBg: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    icon: <BookOpen className="h-3.5 w-3.5" />,
  },
  conference: {
    label: "Conference",
    color: "#f472b6",
    badgeBg: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    icon: <Microscope className="h-3.5 w-3.5" />,
  },
  patent: {
    label: "Patent",
    color: "#fb923c",
    badgeBg: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    icon: <ScrollText className="h-3.5 w-3.5" />,
  },
  copyright: {
    label: "Copyright",
    color: "#34d399",
    badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: <Copyright className="h-3.5 w-3.5" />,
  },
  certificate: {
    label: "Certificate",
    color: "#fbbf24",
    badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: <Award className="h-3.5 w-3.5" />,
  },
  fdp: {
    label: "FDP",
    color: "#e879f9",
    badgeBg: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
    icon: <GraduationCap className="h-3.5 w-3.5" />,
  },
}

export const statusConfig: Record<string, string> = {
  PUBLISHED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  APPROVED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  GRANTED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  PRESENTED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  COMPLETED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  UNDER_REVIEW: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  SUBMITTED: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  APPLIED: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  REJECTED: "bg-red-500/15 text-red-400 border-red-500/25",
}

export function formatStatus(status: string) {
  return status.replace(/_/g, " ")
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return null
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function AuthorAvatars({
  studentAuthors,
  facultyAuthors,
}: {
  studentAuthors?: { user: Author }[]
  facultyAuthors?: { user: Author }[]
}) {
  const all = [
    ...(studentAuthors ?? []).map((a) => a.user),
    ...(facultyAuthors ?? []).map((a) => a.user),
  ]
  if (!all.length) return null
  const visible = all.slice(0, 3)

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visible.map((author) => {
          const initials = author.name
            ? author.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
            : "?"
          return (
            <Avatar key={author.id} className="h-6 w-6 border-2 border-card ring-1 ring-border/30">
              <AvatarImage src={author.image ?? ""} alt={author.name ?? ""} />
              <AvatarFallback className="text-[8px] font-bold bg-muted text-muted-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          )
        })}
      </div>
      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
        {all.slice(0, 2).map((a) => a.name?.split(" ")[0]).filter(Boolean).join(", ")}
        {all.length > 2 ? ` +${all.length - 2}` : ""}
      </span>
    </div>
  )
}

export function ResearchPostCard(props: ResearchPostCardProps) {
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
    studentAuthors,
    facultyAuthors,
  } = props

  const [dialogOpen, setDialogOpen] = useState(false)
  const cfg = typeConfig[type]
  const statusClass = status ? (statusConfig[status] ?? "bg-muted/30 text-muted-foreground border-border/40") : null

  return (
    <>
      {/* Card — click to open dialog */}
      <div
        onClick={() => setDialogOpen(true)}
        className="group relative flex flex-col lg:flex-row overflow-hidden rounded-2xl border border-border/40 bg-card/70 backdrop-blur-sm cursor-pointer transition-all duration-300 hover:border-[#c9f53b]/30 hover:shadow-xl hover:-translate-y-0.5"
      >
        {/* Cover image — top on small/md, left column on lg+ */}
        <div className="relative h-44 w-full lg:h-auto lg:w-1/4  lg:shrink-0 overflow-hidden bg-muted/30">
          {imageUrl ? (
            <>
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 192px"
              />
              {/* gradient: bottom on vertical, right on horizontal */}
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-card/90 via-card/20 to-transparent" />
            </>
          ) : (
            <div
              className="flex h-full w-full min-h-[8rem] items-center justify-center flex-col gap-3"
              style={{ background: `linear-gradient(135deg, ${cfg.color}18, transparent 80%)` }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl border"
                style={{ background: `${cfg.color}18`, borderColor: `${cfg.color}30`, color: cfg.color }}
              >
                <span className="scale-[1.8]">{cfg.icon}</span>
              </div>
              <span className="text-xs font-medium" style={{ color: cfg.color }}>
                {cfg.label}
              </span>
            </div>
          )}

          {/* Type badge — top-left always */}
          <div className="absolute top-3 left-3">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-md ${cfg.badgeBg}`}
            >
              {cfg.icon}
              {cfg.label}
            </span>
          </div>

          {/* Visibility badge — top-right on small/md, hidden on lg (shown in content area) */}
          {isOwnProfile && isPublic !== undefined && (
            <div className="absolute top-3 right-3 lg:hidden">
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border backdrop-blur-md ${
                  isPublic
                    ? "bg-[#c9f53b]/15 text-[#c9f53b] border-[#c9f53b]/25"
                    : "bg-black/40 text-white/70 border-white/10"
                }`}
              >
                {isPublic ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
                {isPublic ? "Public" : "Private"}
              </span>
            </div>
          )}

          {/* PDF button — bottom-right on small/md, hidden on lg (shown in content area) */}
          {documentUrl && (
            <div className="absolute bottom-3 right-3 lg:hidden">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(documentUrl, "_blank")
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-black/60 hover:bg-black/80 text-white border border-white/10 backdrop-blur-md transition-all hover:scale-105"
              >
                <FileDown className="h-3 w-3" />
                PDF
              </button>
            </div>
          )}
        </div>

        {/* Content body */}
        <div className="flex flex-col flex-1 p-4 gap-2 min-w-0">
          {/* Status + date + lg visibility */}
          <div className="flex items-center gap-2 flex-wrap">
            {status && statusClass && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusClass}`}>
                {formatStatus(status)}
              </span>
            )}
            {/* Visibility badge — only shown here on lg+ */}
            {isOwnProfile && isPublic !== undefined && (
              <span
                className={`hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                  isPublic
                    ? "bg-[#c9f53b]/10 text-[#c9f53b] border-[#c9f53b]/25"
                    : "bg-muted/40 text-muted-foreground border-border/30"
                }`}
              >
                {isPublic ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
                {isPublic ? "Public" : "Private"}
              </span>
            )}
            {date && (
              <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                <Calendar className="h-3 w-3" />
                {formatDate(date)}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-sm lg:text-base text-foreground leading-snug group-hover:text-[#c9f53b] transition-colors duration-200 line-clamp-2">
            {title}
          </h3>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>
          )}

          {/* Abstract — more lines on lg */}
          {abstract && (
            <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2 lg:line-clamp-3 flex-1">
              {abstract}
            </p>
          )}

          {/* Keywords — more chips on lg */}
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto pt-1">
              {keywords.slice(0, 5).map((kw) => (
                <span
                  key={kw}
                  className="px-1.5 py-0.5 rounded-full text-[9px] font-medium border"
                  style={{
                    background: `${cfg.color}10`,
                    color: `${cfg.color}cc`,
                    borderColor: `${cfg.color}25`,
                  }}
                >
                  #{kw}
                </span>
              ))}
              {keywords.length > 5 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] text-muted-foreground border border-border/30">
                  +{keywords.length - 5}
                </span>
              )}
            </div>
          )}

          {/* Bottom row: authors + links + lg PDF button */}
          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border/20">
            <AuthorAvatars studentAuthors={studentAuthors} facultyAuthors={facultyAuthors} />
            <div className="flex items-center gap-2 shrink-0">
              {doi && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(`https://doi.org/${doi}`, "_blank")
                  }}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-[#c9f53b] transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  DOI
                </button>
              )}
              {link && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(link, "_blank")
                  }}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-[#c9f53b] transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Paper
                </button>
              )}
              {/* PDF download — only shown here on lg+ */}
              {documentUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(documentUrl, "_blank")
                  }}
                  className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[#c9f53b]/10 hover:bg-[#c9f53b]/20 text-[#c9f53b] border border-[#c9f53b]/25 transition-all"
                >
                  <FileDown className="h-3 w-3" />
                  PDF
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Accent line: bottom on vertical, right side on horizontal */}
        <div
          className="absolute bottom-0 left-0 h-0.5 w-0 lg:h-0 lg:w-0.5 lg:top-0 lg:right-0 lg:left-auto lg:bottom-auto group-hover:w-full lg:group-hover:w-0.5 group-hover:h-0.5 lg:group-hover:h-full transition-all duration-500 rounded-b-2xl lg:rounded-r-2xl"
          style={{ background: cfg.color }}
        />
      </div>

      {/* Full detail dialog */}
      <ResearchDetailDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        data={props}
      />
    </>
  )
}
