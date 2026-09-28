/**
 * SECURITY CONTRACT:
 *  - This middleware provides a first line of defense at the edge.
 *  - It does NOT replace per-route authorization checks — every API route
 *    and server action MUST independently verify auth and permissions.
 *  - Authentication state here is derived from the JWT session cookie.
 *  - Role-based access in this file covers NAVIGATION protection only.
 *    Data-level authorization always happens inside each route handler.
 *
 * Route protection now uses centralized ROUTE_ACCESS configuration from
 * src/lib/config/sidebar.ts for consistency between sidebar and middleware.
 */

import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { canAccess, type Role } from '@/lib/config/sidebar'

// ─── Route pattern helpers ────────────────────────────────────────────────────

function matchesAny(pathname: string, patterns: string[]): boolean {
  return patterns.some((p) => {
    if (p.endsWith('*')) return pathname.startsWith(p.slice(0, -1))
    return pathname === p || pathname.startsWith(p + '/')
  })
}

// ─── Public route definitions ─────────────────────────────────────────────────

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
  '/api/auth*',         // NextAuth routes
  '/api/public*',       // Public data APIs
  '/api/faculty-verification/verify*', // Token-based verification
]

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

  // ── 4. Dashboard route authorization using centralized config ─────────────
  if (pathname.startsWith('/dashboard')) {
    const userRole = role as Role
    
    if (!canAccess(userRole, pathname)) {
      // User doesn't have permission for this dashboard route
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    
    return NextResponse.next()
  }

  // ── 5. API route authorization (manual rules for API paths) ───────────────
  // API routes use manual rules since they're not in sidebar config
  
  // SUPERADMIN API routes
  if (pathname.startsWith('/api/superadmin')) {
    if (role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.next()
  }

  // ADMIN+ API routes
  if (pathname.startsWith('/api/admin')) {
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.next()
  }

  // FACULTY+ API routes
  if (pathname.startsWith('/api/faculty-verification')) {
    const ROLE_RANK = { STUDENT: 0, FACULTY: 1, EDITOR: 2, ADMIN: 3, SUPERADMIN: 4 }
    if ((ROLE_RANK[role] ?? -1) < ROLE_RANK.FACULTY) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.next()
  }

  // ── 6. All other authenticated routes ─────────────────────────────────────
  // API profile/notifications/user routes, etc. — already authenticated at step 2
  return NextResponse.next()
})

// ─── Matcher ──────────────────────────────────────────────────────────────────
// The middleware runs on all routes EXCEPT static files and Next.js internals.

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)).*)',
  ],
}
