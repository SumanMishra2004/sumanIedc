"use client"

/**
 * useFilterCookie
 *
 * A generic React hook that persists table-filter state in a client-readable
 * browser cookie so that filter selections survive page navigations and hard
 * refreshes.
 *
 * Usage:
 *   const [filters, setFilters] = useFilterCookie("bc_filters", defaultFilters)
 *
 * Cookie key naming convention:
 *   "bc_filters"       → book-chapter filters
 *   "journal_filters"  → journal filters
 *   "conf_filters"     → conference filters
 *   "patent_filters"   → patent filters
 *   "copy_filters"     → copyright filters
 *   "cert_filters"     → certificate filters
 *   "fdp_filters"      → FDP filters
 *   "grant_filters"    → grant-in filters
 *
 * Cookies expire after 1 day so stale selections don't cause confusion after
 * data changes.
 */

import { useCallback, useEffect, useState } from "react"

const FILTER_COOKIE_MAX_AGE = 24 * 60 * 60 // 1 day in seconds

function writeCookie(key: string, value: unknown): void {
  if (typeof document === "undefined") return
  try {
    const encoded = encodeURIComponent(JSON.stringify(value))
    document.cookie = `${key}=${encoded}; max-age=${FILTER_COOKIE_MAX_AGE}; path=/; SameSite=Strict`
  } catch {
    // Ignore — value may be too large or not serialisable
  }
}

function readCookie<T>(key: string, fallback: T): T {
  if (typeof document === "undefined") return fallback

  const entry = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${key}=`))

  if (!entry) return fallback

  try {
    const raw = entry.split("=").slice(1).join("=")
    return JSON.parse(decodeURIComponent(raw)) as T
  } catch {
    return fallback
  }
}

export function useFilterCookie<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void, () => void] {
  // Initialise from the default to avoid SSR mismatch.
  // The cookie value is applied after mount (client only).
  const [state, setState] = useState<T>(defaultValue)

  useEffect(() => {
    setState(readCookie<T>(key, defaultValue))
    // We only want to run this on mount or when the key changes, not on every
    // render — defaultValue is intentionally excluded from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const setAndPersist = useCallback(
    (value: T) => {
      setState(value)
      writeCookie(key, value)
    },
    [key]
  )

  /** Reset to defaultValue and remove the cookie. */
  const reset = useCallback(() => {
    setState(defaultValue)
    if (typeof document !== "undefined") {
      document.cookie = `${key}=; max-age=0; path=/; SameSite=Strict`
    }
  }, [key, defaultValue])

  return [state, setAndPersist, reset]
}
