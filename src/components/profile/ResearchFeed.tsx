"use client"

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react"
import { ResearchPostCard, typeConfig } from "./ResearchPostCard"
import {
  LayoutGrid,
  FileText,
  BookOpen,
  Microscope,
  ScrollText,
  Copyright,
  Award,
  GraduationCap,
  SearchX,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  ChevronDown,
  Loader2,
  Trophy,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// ─── Types ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AR = Record<string, any>

interface ResearchData {
  journals: unknown[]
  bookChapters: unknown[]
  conferences: unknown[]
  patents: unknown[]
  copyrights: unknown[]
  certificates: unknown[]
  fdps: unknown[]
  achievements: unknown[]
}

interface ResearchFeedProps {
  research: ResearchData
  isOwnProfile: boolean
  userRole: string
}

type TabKey =
  | "all"
  | "journals"
  | "bookChapters"
  | "conferences"
  | "patents"
  | "copyrights"
  | "certificates"
  | "fdps"
  | "achievements"

type SortKey = "newest" | "oldest" | "az" | "za"

interface Tab {
  key: TabKey
  label: string
  icon: React.ReactNode
  color: string
}

// ─── Normalised item ─────────────────────────────────────────────────────────

interface NormalisedItem {
  _type: TabKey
  _sortDate: number
  _title: string
  _status: string
  id: string
  title: string
  subtitle?: string
  abstract?: string | null
  keywords?: string[]
  status?: string
  date?: string | null
  doi?: string | null
  link?: string | null
  documentUrl?: string | null
  imageUrl?: string | null
  isPublic?: boolean
  studentAuthors?: AR[]
  facultyAuthors?: AR[]
  extras?: Record<string, string | null | undefined>
}

const PAGE_SIZE = 5

// ─── Tabs ────────────────────────────────────────────────────────────────────

const baseTabs: Tab[] = [
  { key: "all", label: "All", icon: <LayoutGrid className="h-3.5 w-3.5" />, color: "#c9f53b" },
  { key: "journals", label: "Journals", icon: <FileText className="h-3.5 w-3.5" />, color: "#60a5fa" },
  { key: "bookChapters", label: "Book Chapters", icon: <BookOpen className="h-3.5 w-3.5" />, color: "#a78bfa" },
  { key: "conferences", label: "Conferences", icon: <Microscope className="h-3.5 w-3.5" />, color: "#f472b6" },
  { key: "patents", label: "Patents", icon: <ScrollText className="h-3.5 w-3.5" />, color: "#fb923c" },
  { key: "copyrights", label: "Copyrights", icon: <Copyright className="h-3.5 w-3.5" />, color: "#34d399" },
  { key: "certificates", label: "Certificates", icon: <Award className="h-3.5 w-3.5" />, color: "#fbbf24" },
  { key: "achievements", label: "Achievements", icon: <Trophy className="h-3.5 w-3.5" />, color: "#ef4444" },
]
const fdpTab: Tab = { key: "fdps", label: "FDPs", icon: <GraduationCap className="h-3.5 w-3.5" />, color: "#e879f9" }

// ─── Normalise raw data into flat items ──────────────────────────────────────

function normalise(research: ResearchData): NormalisedItem[] {
  const items: NormalisedItem[] = []

  for (const j of research.journals as AR[]) {
    items.push({
      _type: "journals", _sortDate: new Date(j.publicationDate ?? j.createdAt).getTime(),
      _title: j.title ?? "", _status: j.journalStatus ?? "",
      id: j.id, title: j.title, subtitle: j.journalName,
      abstract: j.abstract, keywords: j.keywords ?? [],
      status: j.journalStatus, date: j.publicationDate ?? j.createdAt,
      doi: j.doi, link: j.paperLink, documentUrl: j.documentUrl, imageUrl: j.imageUrl,
      isPublic: j.isPublic, studentAuthors: j.studentAuthors, facultyAuthors: j.facultyAuthors,
      extras: {
        Scope: j.scope, Indexing: j.indexing,
        Quartile: j.quartile !== "NOT_APPLICABLE" ? j.quartile : null,
        "Impact Factor": j.impactFactor ? String(j.impactFactor) : null,
        Publisher: j.publisher,
      },
    })
  }

  for (const b of research.bookChapters as AR[]) {
    items.push({
      _type: "bookChapters", _sortDate: new Date(b.publicationDate ?? b.createdAt).getTime(),
      _title: b.title ?? "", _status: b.bookChapterStatus ?? "",
      id: b.id, title: b.title, subtitle: b.publisher,
      abstract: b.abstract, keywords: b.keywords ?? [],
      status: b.bookChapterStatus, date: b.publicationDate ?? b.createdAt,
      doi: b.doi, documentUrl: b.documentUrl, imageUrl: b.imageUrl,
      isPublic: b.isPublic, studentAuthors: b.studentAuthors, facultyAuthors: b.facultyAuthors,
      extras: { "ISBN/ISSN": b.isbnIssn },
    })
  }

  for (const c of research.conferences as AR[]) {
    items.push({
      _type: "conferences", _sortDate: new Date(c.conferenceDate ?? c.createdAt).getTime(),
      _title: c.paperName ?? c.conferenceName ?? "", _status: c.conferenceStatus ?? "",
      id: c.id, title: c.paperName ?? c.conferenceName, subtitle: c.conferenceName,
      abstract: c.abstract, keywords: c.keywords ?? [],
      status: c.conferenceStatus, date: c.conferenceDate ?? c.createdAt,
      doi: c.paperDoi, link: c.paperLink, documentUrl: c.documentUrl, imageUrl: c.imageUrl,
      isPublic: c.isPublic, studentAuthors: c.studentAuthors, facultyAuthors: c.facultyAuthors,
      extras: { Mode: c.mode, Publisher: c.conferencePublisher },
    })
  }

  for (const p of research.patents as AR[]) {
    items.push({
      _type: "patents", _sortDate: new Date(p.publicationDate ?? p.grantDate ?? p.filingDate ?? p.createdAt).getTime(),
      _title: p.title ?? "", _status: p.patentStatus ?? "",
      id: p.id, title: p.title, abstract: p.abstract, keywords: p.keywords ?? [],
      status: p.patentStatus, date: p.publicationDate ?? p.grantDate ?? p.filingDate ?? p.createdAt,
      link: p.patentLink, documentUrl: p.documentUrl, imageUrl: p.imageUrl,
      isPublic: p.isPublic, studentAuthors: p.studentAuthors, facultyAuthors: p.facultyAuthors,
      extras: { "Application No": p.applicationNo, "Patent No": p.grantedPatentNo },
    })
  }

  for (const c of research.copyrights as AR[]) {
    items.push({
      _type: "copyrights", _sortDate: new Date(c.dateOfPublished ?? c.dateOfGrant ?? c.createdAt).getTime(),
      _title: c.title ?? "", _status: c.copyrightStatus ?? "",
      id: c.id, title: c.title, abstract: c.abstract,
      status: c.copyrightStatus, date: c.dateOfPublished ?? c.dateOfGrant ?? c.createdAt,
      documentUrl: c.documentUrl, imageUrl: c.imageUrl,
      isPublic: c.isPublic, studentAuthors: c.studentAuthors, facultyAuthors: c.facultyAuthors,
      extras: { "Reg No": c.regNo },
    })
  }

  for (const cert of research.certificates as AR[]) {
    items.push({
      _type: "certificates", _sortDate: new Date(cert.dateOfCompletion ?? cert.createdAt).getTime(),
      _title: cert.title ?? "", _status: "",
      id: cert.id, title: cert.title, subtitle: cert.offeredBy,
      abstract: cert.description, keywords: cert.keywords ?? [],
      date: cert.dateOfCompletion, documentUrl: cert.documentUrl,
      isPublic: cert.isPublic,
    })
  }

  for (const f of research.fdps as AR[]) {
    items.push({
      _type: "fdps", _sortDate: new Date(f.startDate ?? f.createdAt).getTime(),
      _title: f.title ?? "", _status: "",
      id: f.id, title: f.title, subtitle: f.organizedBy,
      abstract: f.description, keywords: f.keywords ?? [],
      date: f.startDate ?? f.createdAt,
      extras: { Duration: f.duration, Topic: f.topic },
    })
  }

  for (const a of (research.achievements || []) as AR[]) {
    items.push({
      _type: "achievements", _sortDate: new Date(a.createdAt).getTime(),
      _title: a.title ?? "", _status: "",
      id: a.id, title: a.title, subtitle: a.category,
      abstract: a.description, keywords: [],
      date: a.year ?? a.createdAt, documentUrl: a.documentUrl, imageUrl: a.imageUrl,
      isPublic: a.isPublic,
    })
  }

  return items
}

// ─── Card renderer ────────────────────────────────────────────────────────────

function renderCard(item: NormalisedItem, isOwnProfile: boolean) {
  const typeMap: Record<TabKey, Parameters<typeof ResearchPostCard>[0]["type"]> = {
    all: "journal",
    journals: "journal",
    bookChapters: "bookChapter",
    conferences: "conference",
    patents: "patent",
    copyrights: "copyright",
    certificates: "certificate",
    fdps: "fdp",
    achievements: "achievement",
  }
  return (
    <ResearchPostCard
      key={`${item._type}-${item.id}`}
      id={item.id}
      type={typeMap[item._type]}
      title={item.title}
      subtitle={item.subtitle}
      abstract={item.abstract}
      keywords={item.keywords}
      status={item.status}
      date={item.date}
      doi={item.doi}
      link={item.link}
      documentUrl={item.documentUrl}
      imageUrl={item.imageUrl}
      isPublic={item.isPublic}
      isOwnProfile={isOwnProfile}
      studentAuthors={item.studentAuthors as any}
      facultyAuthors={item.facultyAuthors as any}
      extras={item.extras}
    />
  )
}

// ─── Sort options ─────────────────────────────────────────────────────────────

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest First" },
  { key: "oldest", label: "Oldest First" },
  { key: "az", label: "A → Z" },
  { key: "za", label: "Z → A" },
]

// ─── Collect unique statuses ──────────────────────────────────────────────────

function getStatuses(items: NormalisedItem[]) {
  const set = new Set<string>()
  for (const i of items) if (i._status) set.add(i._status)
  return Array.from(set).sort()
}

// ─── Card skeleton ────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="animate-pulse flex flex-col lg:flex-row overflow-hidden rounded-2xl border border-border/30 bg-card/50">
      <div className="h-44 w-full lg:w-52 lg:shrink-0 bg-muted/40" />
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex gap-2">
          <div className="h-5 w-20 rounded-full bg-muted/50" />
          <div className="h-5 w-16 rounded-full bg-muted/40" />
          <div className="ml-auto h-5 w-24 rounded bg-muted/30" />
        </div>
        <div className="h-5 w-3/4 rounded bg-muted/50" />
        <div className="h-4 w-1/2 rounded bg-muted/40" />
        <div className="h-4 w-full rounded bg-muted/30" />
        <div className="h-4 w-5/6 rounded bg-muted/25" />
        <div className="flex gap-1.5 mt-auto">
          {[1, 2, 3].map((i) => <div key={i} className="h-5 w-14 rounded-full bg-muted/30" />)}
        </div>
      </div>
    </div>
  )
}

// ─── Dropdown ────────────────────────────────────────────────────────────────

function Dropdown({
  label,
  value,
  options,
  onChange,
  icon,
}: {
  label: string
  value: string
  options: { key: string; label: string }[]
  onChange: (k: string) => void
  icon?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  const selected = options.find((o) => o.key === value)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border/40 bg-card/60 text-xs font-medium text-foreground hover:border-[#c9f53b]/40 hover:bg-[#c9f53b]/5 transition-all whitespace-nowrap"
      >
        {icon}
        {selected?.label ?? label}
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 min-w-[160px] rounded-xl border border-border/40 bg-card shadow-xl overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => { onChange(opt.key); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-[#c9f53b]/10 hover:text-[#c9f53b] ${
                value === opt.key ? "bg-[#c9f53b]/10 text-[#c9f53b] font-semibold" : "text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ResearchFeed({ research, isOwnProfile, userRole }: ResearchFeedProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sort, setSort] = useState<SortKey>("newest")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const tabs: Tab[] = useMemo(() => {
    const t = [...baseTabs]
    if (userRole === "FACULTY" || userRole === "ADMIN") t.push(fdpTab)
    return t
  }, [userRole])

  // Normalise once
  const allItems = useMemo(() => normalise(research), [research])

  // Tab counts (unfiltered)
  const tabCounts = useMemo(() => {
    const counts: Record<TabKey, number> = {
      all: allItems.length,
      journals: 0, bookChapters: 0, conferences: 0,
      patents: 0, copyrights: 0, certificates: 0, fdps: 0, achievements: 0,
    }
    for (const item of allItems) counts[item._type] = (counts[item._type] ?? 0) + 1
    return counts
  }, [allItems])

  // Tab-filtered items
  const tabItems = useMemo(() =>
    activeTab === "all" ? allItems : allItems.filter((i) => i._type === activeTab),
    [allItems, activeTab]
  )

  // Available statuses for current tab
  const statuses = useMemo(() => getStatuses(tabItems), [tabItems])

  const statusOptions = useMemo(() => [
    { key: "all", label: "All Statuses" },
    ...statuses.map((s) => ({ key: s, label: s.replace(/_/g, " ") })),
  ], [statuses])

  // Apply search + status filter + sort
  const filteredItems = useMemo(() => {
    let items = tabItems

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (i) =>
          i._title.toLowerCase().includes(q) ||
          i.abstract?.toLowerCase().includes(q) ||
          i.keywords?.some((k) => k.toLowerCase().includes(q)) ||
          i.subtitle?.toLowerCase().includes(q)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      items = items.filter((i) => i._status === statusFilter)
    }

    // Sort
    items = [...items].sort((a, b) => {
      if (sort === "newest") return b._sortDate - a._sortDate
      if (sort === "oldest") return a._sortDate - b._sortDate
      if (sort === "az") return a._title.localeCompare(b._title)
      if (sort === "za") return b._title.localeCompare(a._title)
      return 0
    })

    return items
  }, [tabItems, search, statusFilter, sort])

  // Reset visible count when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount(PAGE_SIZE)
  }, [activeTab, search, statusFilter, sort])

  // Visible slice
  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount]
  )

  const hasMore = visibleCount < filteredItems.length

  // Infinite scroll via IntersectionObserver
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return
    setIsLoadingMore(true)
    // Simulate a small delay for the FB-like feel
    setTimeout(() => {
      setVisibleCount((c) => c + PAGE_SIZE)
      setIsLoadingMore(false)
    }, 600)
  }, [hasMore, isLoadingMore])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: "200px" }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  const activeTabConfig = tabs.find((t) => t.key === activeTab)
  const hasFilters = search.trim() !== "" || statusFilter !== "all"

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
      {/* ── Header ── */}
      <div className="px-6 pt-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Research &amp; Publications
          </h2>
          <span className="text-xs text-muted-foreground">
            {filteredItems.length} {filteredItems.length === 1 ? "result" : "results"}
          </span>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-0.5 overflow-x-auto scrollbar-none -mx-1 px-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-1.5 px-3 py-2.5 rounded-t-lg text-xs font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                  isActive
                    ? "border-b-2"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/30"
                }`}
                style={isActive ? { borderBottomColor: tab.color, color: tab.color } : {}}
              >
                <span style={isActive ? { color: tab.color } : {}}>{tab.icon}</span>
                {tab.label}
                {tabCounts[tab.key] > 0 && (
                  <span
                    className={`ml-0.5 px-1.5 py-0 rounded-full text-[10px] font-bold min-w-[18px] text-center ${
                      isActive ? "text-black" : "bg-muted text-muted-foreground"
                    }`}
                    style={isActive ? { background: tab.color } : {}}
                  >
                    {tabCounts[tab.key]}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div className="h-px bg-border/40 -mx-6" />
      </div>

      {/* ── Search + Filter + Sort bar ── */}
      <div className="px-6 pt-4 pb-3 flex flex-col sm:flex-row gap-2.5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search title, abstract, keywords…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 h-9 text-xs bg-card/60 border-border/40 focus:border-[#c9f53b]/50 placeholder:text-muted-foreground/60"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status filter */}
        {statusOptions.length > 1 && (
          <Dropdown
            label="Status"
            value={statusFilter}
            options={statusOptions}
            onChange={setStatusFilter}
            icon={<SlidersHorizontal className="h-3 w-3 text-muted-foreground" />}
          />
        )}

        {/* Sort */}
        <Dropdown
          label="Sort"
          value={sort}
          options={sortOptions}
          onChange={(k) => setSort(k as SortKey)}
          icon={<ArrowUpDown className="h-3 w-3 text-muted-foreground" />}
        />

        {/* Clear filters */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(""); setStatusFilter("all") }}
            className="h-9 px-3 text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10 shrink-0"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-border/20 mx-6" />

      {/* ── Feed ── */}
      <div className="p-6 space-y-4">
        {filteredItems.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/40"
              style={{ background: `${activeTabConfig?.color ?? "#c9f53b"}12` }}
            >
              <SearchX className="h-8 w-8" style={{ color: activeTabConfig?.color ?? "#c9f53b" }} />
            </div>
            <p className="text-foreground font-medium mb-1">No results found</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              {hasFilters
                ? "Try adjusting your search or filters."
                : isOwnProfile
                ? `You haven't added any ${activeTab === "all" ? "research" : activeTabConfig?.label.toLowerCase()} yet.`
                : `No public ${activeTab === "all" ? "research" : activeTabConfig?.label.toLowerCase()} found.`}
            </p>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearch(""); setStatusFilter("all") }}
                className="mt-3 text-xs text-[#c9f53b] hover:bg-[#c9f53b]/10"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Cards */}
            {visibleItems.map((item) => renderCard(item, isOwnProfile))}

            {/* Loading skeletons */}
            {isLoadingMore && (
              <div className="space-y-4">
                {Array.from({ length: Math.min(PAGE_SIZE, filteredItems.length - visibleCount) }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Sentinel — IntersectionObserver target */}
            <div ref={sentinelRef} className="h-1" />

            {/* Load more indicator */}
            {hasMore && !isLoadingMore && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={loadMore}
                  className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-[#c9f53b] transition-colors"
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading more…
                </button>
              </div>
            )}

            {/* End of results */}
            {!hasMore && filteredItems.length > PAGE_SIZE && (
              <div className="flex items-center gap-3 py-4">
                <div className="flex-1 h-px bg-border/30" />
                <span className="text-xs text-muted-foreground px-2">
                  All {filteredItems.length} results shown
                </span>
                <div className="flex-1 h-px bg-border/30" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
