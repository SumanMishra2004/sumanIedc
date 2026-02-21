/**
 * Faculty Cache Utility
 *
 * Stores the faculty user list in a client-readable browser cookie so that
 * every form that requires faculty selection (book chapters, journals,
 * conferences, patents, copyrights, grants) can read from the cookie instead
 * of hitting the API on every popover open.
 *
 * Faculty list is small (~20-30 entries ≈ 2-3 KB) — well within the 4 KB
 * cookie limit.
 *
 * Invalidation strategy:
 *  - Admin adds / removes / changes a faculty entry in SpecialUserForm or
 *    SpecialUserTable → call `clearFacultyCache()` immediately after the
 *    mutation, which forces a fresh API fetch the next time any form opens.
 *  - The cookie has a 7-day Max-Age as a soft safety net.
 */

const FACULTY_CACHE_KEY = "faculty_list_v1"
const CACHE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60 // 7 days

export type CachedFaculty = {
  id: string
  name: string
  email: string
  image?: string
}

/* ------------------------------------------------------------------
   Internal helpers — browser cookie read / write
------------------------------------------------------------------ */

function writeFacultyCookie(faculty: CachedFaculty[]): void {
  if (typeof document === "undefined") return

  try {
    const value = encodeURIComponent(JSON.stringify(faculty))
    document.cookie = `${FACULTY_CACHE_KEY}=${value}; max-age=${CACHE_MAX_AGE_SECONDS}; path=/; SameSite=Strict`
  } catch {
    // Silently ignore — data too large, or JSON failed
  }
}

function readFacultyCookie(): CachedFaculty[] | null {
  if (typeof document === "undefined") return null

  const entry = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${FACULTY_CACHE_KEY}=`))

  if (!entry) return null

  try {
    const raw = entry.split("=").slice(1).join("=")
    const parsed = JSON.parse(decodeURIComponent(raw))
    return Array.isArray(parsed) ? (parsed as CachedFaculty[]) : null
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------
   Public API
------------------------------------------------------------------ */

/**
 * Returns the cached faculty list.
 * On a cache miss (first load or after `clearFacultyCache()`) it fetches
 * from the API, writes the cookie, and returns the result.
 */
export async function getFacultyList(): Promise<CachedFaculty[]> {
  const cached = readFacultyCookie()
  if (cached !== null && cached.length > 0) return cached
  return refreshFacultyCache()
}

/**
 * Force a fresh fetch from the API and overwrite the cookie.
 * Called automatically when the cookie is absent; also exported so
 * components can call it intentionally (e.g., after a faculty user signs in
 * for the first time and their role flips to FACULTY).
 */
export async function refreshFacultyCache(): Promise<CachedFaculty[]> {
  try {
    const res = await fetch("/api/user?role=FACULTY&page=1&limit=100", {
      cache: "no-store",
    })

    if (!res.ok) return []

    const data = await res.json()
    const faculty: CachedFaculty[] = (data.data ?? []).map(
      (u: { id: string; name: string; email: string; image?: string | null }) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        // Convert null → undefined so the type stays string|undefined
        image: u.image ?? undefined,
      })
    )

    writeFacultyCookie(faculty)
    return faculty
  } catch {
    return []
  }
}

/**
 * Invalidates the cookie immediately.
 * Call this right after any SpecialUser mutation (add / edit / delete) so the
 * next form open triggers a fresh fetch.
 */
export function clearFacultyCache(): void {
  if (typeof document === "undefined") return
  document.cookie = `${FACULTY_CACHE_KEY}=; max-age=0; path=/; SameSite=Strict`
}
