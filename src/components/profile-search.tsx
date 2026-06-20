"use client"

import * as React from "react"
import { Search, Loader2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface SearchUser {
  id: string
  name: string | null
  image: string | null
  role: string
  department: string | null
  designation: string | null
  degree: string | null
}

const roleMeta: Record<string, { label: string; color: string }> = {
  FACULTY: { label: "Faculty", color: "bg-violet-500/10 text-violet-400" },
  ADMIN: { label: "Admin", color: "bg-amber-500/10 text-amber-400" },
  STUDENT: { label: "Student", color: "bg-sky-500/10 text-sky-400" },
}

export function ProfileSearch() {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchUser[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  React.useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }
    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.users || [])
          setIsOpen(true)
        }
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setIsLoading(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (user: SearchUser) => {
    setIsOpen(false)
    setQuery("")
    router.push(`/dashboard?userId=${user.id}`)
  }

  const handleClear = () => {
    setQuery("")
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        className={cn(
          "relative flex items-center rounded-lg border transition-all duration-200",
          focused
            ? "border-[#c9f53b]/40 bg-background/50 shadow-[0_0_0_3px_rgba(201,245,59,0.08)] ring-1 ring-[#c9f53b]/40"
            : "border-border/45 bg-muted/40 hover:border-border/60"
        )}
      >
        <Search
          className={cn(
            "absolute left-3 size-4 shrink-0 transition-colors pointer-events-none",
            focused ? "text-[#c9f53b]/70" : "text-muted-foreground/50"
          )}
        />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search people..."
          className="h-9 w-full bg-transparent pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setFocused(true)
            if (results.length > 0) setIsOpen(true)
          }}
        />
        <div className="absolute right-2.5 flex items-center">
          {isLoading && (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground/50" />
          )}
          {!isLoading && query && (
            <button
              onClick={handleClear}
              className="flex size-4 items-center justify-center rounded-full bg-muted-foreground/20 text-muted-foreground/60 hover:bg-muted-foreground/30 transition-colors"
            >
              <X className="size-2.5" />
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-border/45 bg-popover text-popover-foreground shadow-xl shadow-black/20">
          {results.length === 0 ? (
            <div className="flex items-center justify-center gap-2 p-6 text-[13px] text-muted-foreground/50">
              <Search className="size-4" />
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="p-1.5">
              <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </p>
              {results.map((user) => {
                const initials = user.name
                  ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                  : "U"
                const meta = roleMeta[user.role] ?? { label: user.role, color: "bg-muted-foreground/10 text-muted-foreground/60" }

                return (
                  <button
                    key={user.id}
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted/60"
                    onClick={() => handleSelect(user)}
                  >
                    <Avatar className="size-8 rounded-lg border border-border/45">
                      <AvatarImage src={user.image ?? ""} alt={user.name ?? "User"} />
                      <AvatarFallback className="rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-1 flex-col overflow-hidden">
                      <span className="truncate text-[13px] font-medium text-foreground">
                        {user.name}
                      </span>
                      <span className="truncate text-[11px] text-muted-foreground/60">
                        {user.department ?? "—"}
                      </span>
                    </div>
                    <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold", meta.color)}>
                      {meta.label}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}