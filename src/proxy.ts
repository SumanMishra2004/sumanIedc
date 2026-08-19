/**
 * Next.js 16+ uses "proxy.ts" instead of the deprecated "middleware.ts".
 *
 * IMPORTANT: We must run in the Node.js runtime (not Edge) because:
 *  - NextAuth JWT verification uses the Node.js `crypto` module
 *  - Argon2 is a native Node.js binding
 *  - Prisma uses Node.js networking APIs
 */

import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Session } from 'next-auth'

// ── Route groups ──────────────────────────────────────────────────────────────
const AUTH_ROUTES      = ['/auth/signin', '/auth/signup']
const ONBOARDING_ROUTE = '/setup-profile'

const PROTECTED_PREFIXES: Record<string, string[]> = {
  '/dashboard': ['STUDENT', 'FACULTY', 'EDITOR', 'ADMIN', 'SUPERADMIN'],
  '/student':   ['STUDENT', 'ADMIN', 'SUPERADMIN'],
  '/faculty':   ['FACULTY', 'EDITOR', 'ADMIN', 'SUPERADMIN'],
  '/admin':     ['ADMIN', 'SUPERADMIN'],
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + '/'),
  )
}

function getAllowedRoles(pathname: string): string[] | null {
  for (const [prefix, roles] of Object.entries(PROTECTED_PREFIXES)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return roles
    }
  }
  return null
}

// Augmented request type — auth() injects `auth: Session | null` at runtime
type NextAuthRequest = NextRequest & { auth: Session | null }

export default auth(async function proxy(request: NextRequest) {
  // Cast to augmented type to access session injected by auth()
  const req        = request as NextAuthRequest
  const session    = req.auth
  const pathname   = req.nextUrl.pathname
  const isLoggedIn = !!session?.user

  // ── 1. Redirect authenticated users away from auth pages ─────────────────
  if (isAuthRoute(pathname)) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // ── 2. Require authentication for all protected route groups ──────────────
  const allowedRoles = getAllowedRoles(pathname)
  if (allowedRoles !== null) {
    if (!isLoggedIn) {
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }

    const userRole = (session?.user as { role?: string })?.role ?? 'STUDENT'

    // ── 3. Role-based access control ──────────────────────────────────────
    if (!allowedRoles.includes(userRole)) {
      if (userRole === 'SUPERADMIN') return NextResponse.redirect(new URL('/dashboard', request.url))
      if (userRole === 'ADMIN')   return NextResponse.redirect(new URL('/dashboard', request.url))
      if (userRole === 'EDITOR')  return NextResponse.redirect(new URL('/dashboard', request.url))
      if (userRole === 'FACULTY') return NextResponse.redirect(new URL('/dashboard', request.url))
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }


  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *  - _next/static  (Next.js static assets)
     *  - _next/image   (image optimisation)
     *  - favicon.ico
     *  - /api/auth/*   (NextAuth internal handlers — must be unrestricted)
     *  - public file extensions (images, fonts, css, js)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
