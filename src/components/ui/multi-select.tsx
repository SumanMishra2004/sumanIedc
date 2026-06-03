/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import * as React from "react"
import { Check, X, ChevronDown, Loader2 } from "lucide-react"
import { getFacultyList, type CachedFaculty } from "@/lib/faculty-cache"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

type User = {
  id: string
  name: string
  email: string
  image?: string
}

// sessionStorage key + TTL for the student list (client cache, not cookie,
// because students can be hundreds of entries)
const STUDENT_CACHE_KEY = "student_list_cache"
const STUDENT_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

type StudentCache = { data: User[]; ts: number }

function readStudentCache(): User[] | null {
  if (typeof sessionStorage === "undefined") return null
  try {
    const raw = sessionStorage.getItem(STUDENT_CACHE_KEY)
    if (!raw) return null
    const parsed: StudentCache = JSON.parse(raw)
    if (Date.now() - parsed.ts > STUDENT_CACHE_TTL_MS) return null
    return parsed.data
  } catch {
    return null
  }
}

function writeStudentCache(data: User[]): void {
  if (typeof sessionStorage === "undefined") return
  try {
    sessionStorage.setItem(
      STUDENT_CACHE_KEY,
      JSON.stringify({ data, ts: Date.now() } satisfies StudentCache)
    )
  } catch {
    // sessionStorage may be full — ignore
  }
}

function useDebounce<T>(value: T, delay = 300) {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

interface MultiSelectUsersProps {
  isStudent: boolean
  value: User[]
  onChange: (users: User[]) => void
}

export function MultiSelectUsers({
  isStudent,
  value,
  onChange,
}: MultiSelectUsersProps) {
  const [open, setOpen] = React.useState(false)
  // allFaculty holds the FULL unfiltered list read from the cookie so that
  // local search works without any API calls.
  const [allFaculty, setAllFaculty] = React.useState<CachedFaculty[]>([])
  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebounce(search, 300)

  // Pagination state — only used for the student list (API-backed)
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(false)
  const [loadingMore, setLoadingMore] = React.useState(false)

  /* -------------------------------------------
     FACULTY path — cookie-backed, local search
  ------------------------------------------- */
  const fetchFaculty = React.useCallback(async () => {
    setLoading(true)
    try {
      const faculty = await getFacultyList()
      setAllFaculty(faculty)
      setUsers(faculty)
    } catch (error) {
      console.error("Error loading faculty:", error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  // When the search term changes, filter the cached faculty list locally.
  React.useEffect(() => {
    if (isStudent) return
    const term = debouncedSearch.trim().toLowerCase()
    if (!term) {
      setUsers(allFaculty)
    } else {
      setUsers(
        allFaculty.filter(
          (u) =>
            u.name.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term)
        )
      )
    }
  }, [debouncedSearch, allFaculty, isStudent])

  /* -------------------------------------------
     STUDENT path — API with sessionStorage cache
  ------------------------------------------- */
  const fetchStudents = React.useCallback(
    async (pageNum: number, searchTerm: string, append = false) => {
      if (!open) return

      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      try {
        // For the initial page with no search term, check sessionStorage first
        if (!append && !searchTerm.trim() && pageNum === 1) {
          const cached = readStudentCache()
          if (cached) {
            setUsers(cached)
            setHasMore(false)
            return
          }
        }

        let url = `/api/user?role=STUDENT&page=${pageNum}&limit=50`
        if (searchTerm.trim()) {
          url += `&search=${encodeURIComponent(searchTerm)}`
        }

        const res = await fetch(url)
        const data = await res.json()
        const fetched: User[] = data.data || []

        if (append) {
          setUsers((prev) => [...prev, ...fetched])
        } else {
          setUsers(fetched)
          // Only cache when there's no search term applied
          if (!searchTerm.trim() && pageNum === 1) {
            writeStudentCache(fetched)
          }
        }

        setHasMore(data.hasMore || false)
      } catch (error) {
        console.error("Error fetching students:", error)
        setUsers([])
        setHasMore(false)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [open]
  )

  /* -------------------------------------------
     Load on popover open
  ------------------------------------------- */
  React.useEffect(() => {
    if (!open) return
    if (isStudent) {
      setPage(1)
      fetchStudents(1, debouncedSearch, false)
    } else {
      fetchFaculty()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Student search: re-fetch from API when search term changes
  React.useEffect(() => {
    if (!open || !isStudent) return
    setPage(1)
    fetchStudents(1, debouncedSearch, false)
  }, [debouncedSearch, open, isStudent, fetchStudents])

  /* -------------------------------------------
     Load more — students only
  ------------------------------------------- */
  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchStudents(nextPage, debouncedSearch, true)
  }

  const toggleUser = (user: User) => {
    const exists = value.some((u) => u.id === user.id)
    if (exists) {
      onChange(value.filter((u) => u.id !== user.id))
    } else {
      onChange([...value, user])
    }
  }

  const removeUser = (userId: string) => {
    onChange(value.filter((u) => u.id !== userId))
  }

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between h-12"
            role="combobox"
            aria-expanded={open}
          >
            <span className="text-sm">
              {value.length > 0 
                ? `${value.length} ${isStudent ? 'student' : 'faculty'} selected` 
                : `Select ${isStudent ? 'Students' : 'Faculty'}`
              }
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-100 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={`Search ${isStudent ? 'students' : 'faculty'} by name or email...`}
              onValueChange={setSearch}
              value={search}
            />

            <CommandList>
              <CommandEmpty>
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  "No users found"
                )}
              </CommandEmpty>

              {!loading && users.length > 0 && (
                <CommandGroup>
                  {users.map((user) => {
                    const selected = value.some((u) => u.id === user.id)
                    return (
                      <CommandItem
                        key={user.id}
                        value={user.id}
                        onSelect={() => toggleUser(user)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.image} />
                            <AvatarFallback className="text-xs">
                              {user.name[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium truncate">
                              {user.name}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </span>
                          </div>
                        </div>

                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            selected ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    )
                  })}
                  
                  {/* Load More — students only (faculty list is fully cached) */}
                  {isStudent && hasMore && (
                    <div className="p-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={loadMore}
                        disabled={loadingMore}
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Load More'
                        )}
                      </Button>
                    </div>
                  )}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected users */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((user) => (
            <Badge
              key={user.id}
              variant="secondary"
              className="flex items-center gap-2 py-1.5 px-3"
            >
              <Avatar className="h-5 w-5">
                <AvatarImage src={user.image} />
                <AvatarFallback className="text-xs">
                  {user.name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <span className="text-xs font-medium">{user.name}</span>

              <button
                type="button"
                onClick={() => removeUser(user.id)}
                className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
