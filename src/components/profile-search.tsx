"use client"

import * as React from "react"
import { Search, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"

interface SearchUser {
  id: string
  name: string | null
  image: string | null
  role: string
  department: string | null
  designation: string | null
  degree: string | null
}

export function ProfileSearch() {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchUser[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Fallback if useClickOutside hook isn't available, we use basic event listener
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  React.useEffect(() => {
    if (!query || query.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([])
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    }, 400) // 400ms debounce

    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (user: SearchUser) => {
    setIsOpen(false)
    setQuery("")
    router.push(`/dashboard?userId=${user.id}`)
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search profiles..."
          className="w-full pl-9 bg-background/50 border-border/40 focus-visible:ring-1 focus-visible:ring-[#c9f53b]"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true)
          }}
        />
        {isLoading && (
          <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto rounded-md border border-border/40 bg-card/95 backdrop-blur-md p-1 shadow-md">
          {results.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No profiles found.
            </div>
          ) : (
            results.map((user) => {
              const initials = user.name ? user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : "U"
              const primaryTag = user.role === "FACULTY" ? user.designation : user.degree
              
              return (
                <button
                  key={user.id}
                  className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left hover:bg-muted/50 transition-colors"
                  onClick={() => handleSelect(user)}
                >
                  <Avatar className="h-8 w-8 border border-border/40">
                    <AvatarImage src={user.image ?? ""} alt={user.name ?? "User"} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="text-sm font-medium leading-none truncate">{user.name}</span>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground truncate">
                      <span className="capitalize">{user.role.toLowerCase()}</span>
                      {user.department && (
                        <>
                          <span>•</span>
                          <span className="truncate">{user.department}</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
