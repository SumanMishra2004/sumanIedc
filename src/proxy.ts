/**
 * @file middleware.ts
 * @description Centralized Next.js route protection middleware.
 *
 * SECURITY CONTRACT:
 *  - This middleware provides a first line of defense at the edge.
 *  - It does NOT replace per-route authorization checks — every API route
 *    and server action MUST independently verify auth and permissions.
 *  - Authentication state here is derived from the JWT session cookie.
 *  - Role-based access in this file covers NAVIGATION protection only.
 *    Data-level authorization always happens inside each route handler.
 *
 * Route categories:
 *  PUBLIC     — accessible without authentication
 *  AUTH_ONLY  — any authenticated user
 *  STUDENT+   — STUDENT and higher (all authenticated users)
 *  FACULTY+   — FACULTY and higher
 *  EDITOR+    — EDITOR and higher
 *  ADMIN+     — ADMIN and higher
 *  SUPERADMIN — SUPERADMIN only
 */

import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ─── Route pattern helpers ────────────────────────────────────────────────────

function matchesAny(pathname: string, patterns: string[]): boolean {
  return patterns.some((p) => {
    if (p.endsWith('*')) return pathname.startsWith(p.slice(0, -1))
    return pathname === p || pathname.startsWith(p + '/')
  })
}

// ─── Route definitions ────────────────────────────────────────────────────────

/** Routes that are entirely public — no auth required */
const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/gallery',
  '/team',
  '/research',          // public research listing
  '/achievements',      // public achievements listing
  '/faculty-verification', // token-based — unauthenticated access intended
  '/auth/signin',
  '/auth/signup',
  '/auth/new-verification',
  '/auth/reset-password',
  '/auth/forgot-password',
  '/studio',            // Sanity Studio
  '/api/auth*',         // NextAuth routes
  '/api/public*',       // Public data APIs
  '/api/faculty-verification/verify*', // Token-based verification
]

/** Routes that require authentication but no specific role */
const AUTH_REQUIRED_ROUTES = [
  '/dashboard',
  '/api/profile*',
  '/api/notifications*',
  '/api/user*',
]

/** Routes accessible to FACULTY and higher */
const FACULTY_ROUTES = [
  '/api/faculty-verification*',
]

/** Routes accessible to EDITOR and higher */
const EDITOR_ROUTES = [
  '/dashboard/editor*',
  '/dashboard/events*',
]

/** Routes accessible to ADMIN and higher */
const ADMIN_ROUTES = [
  '/dashboard/admin*',
  '/api/admin*',
]

/** Routes accessible to SUPERADMIN only */
const SUPERADMIN_ROUTES = [
  '/dashboard/superadmin*',
  '/api/superadmin*',
]

// ─── Role rank lookup ─────────────────────────────────────────────────────────

const ROLE_RANK: Record<string, number> = {
  STUDENT:    0,
  FACULTY:    1,
  EDITOR:     2,
  ADMIN:      3,
  SUPERADMIN: 4,
}

function rankOf(role: string): number {
  return ROLE_RANK[role] ?? -1
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export default auth(async function middleware(req: NextRequest & { auth?: unknown }) {
  const { pathname } = req.nextUrl
  const session = (req as any).auth as
    | { user: { id: string; role: string; profileCompleted: boolean } }
    | null

  // ── 1. Always allow public routes ────────────────────────────────────────
  if (matchesAny(pathname, PUBLIC_ROUTES)) {
    return NextResponse.next()
  }

  // ── 2. Require authentication for all other routes ────────────────────────
  if (!session?.user?.id) {
    // API routes return 401 JSON, page routes redirect to signin
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized — authentication required' },
        { status: 401 },
      )
    }
    const signInUrl = new URL('/auth/signin', req.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  const { role, profileCompleted } = session.user

  // ── 3. Force profile completion for non-setup pages ───────────────────────
  if (
    !profileCompleted &&
    !pathname.startsWith('/auth/setup-profile') &&
    !pathname.startsWith('/api/auth') &&
    !pathname.startsWith('/api/profile')
  ) {
    if (!pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/auth/setup-profile', req.url))
    }
    // API calls during setup are allowed through
  }

  // ── 4. SUPERADMIN-only routes ─────────────────────────────────────────────
  if (matchesAny(pathname, SUPERADMIN_ROUTES)) {
    if (rankOf(role) < rankOf('SUPERADMIN')) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // ── 5. ADMIN+ routes ──────────────────────────────────────────────────────
  if (matchesAny(pathname, ADMIN_ROUTES)) {
    if (rankOf(role) < rankOf('ADMIN')) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // ── 6. EDITOR+ routes ─────────────────────────────────────────────────────
  if (matchesAny(pathname, EDITOR_ROUTES)) {
    if (rankOf(role) < rankOf('EDITOR')) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // ── 7. FACULTY+ routes ────────────────────────────────────────────────────
  if (matchesAny(pathname, FACULTY_ROUTES)) {
    if (rankOf(role) < rankOf('FACULTY')) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // ── 8. Auth-required routes (any authenticated user) ──────────────────────
  // Already authenticated at step 2 — allow through
  return NextResponse.next()
})

// ─── Matcher ──────────────────────────────────────────────────────────────────
// The middleware runs on all routes EXCEPT static files and Next.js internals.

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)).*)',
  ],
}
