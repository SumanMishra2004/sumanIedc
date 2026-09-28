import NextAuth, { CredentialsSignin } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import prisma from '@/lib/prisma'
import argon2 from 'argon2'
import { SignInSchema } from '@/lib/validations/auth'
import { loginRateLimiter } from '@/lib/rate-limiter'
import { headers } from 'next/headers'

const DEFAULT_NAME  = 'New User'
const DEFAULT_IMAGE = 'https://api.dicebear.com/7.x/initials/svg?seed=User'

// ── Custom error classes ───────────────────────────────────────────────────────
class EmailNotVerifiedError extends CredentialsSignin {
  code = 'Email not verified'
}
class AccountLockedError extends CredentialsSignin {
  code = 'Account locked'
}

/**
 * Timing-safe dummy hash — prevents user-enumeration via response-time delta.
 * Must be a valid argon2id hash string.
 */
const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$kWFTIyR6RhqkKxPjU2Lp8g$W5Mzj4WZGhU6i3mxjWPBqvX8Q+N1OJQfzG3P7jxsaoc'

const MAX_FAILED_ATTEMPTS = 5
const LOCK_DURATION_MS    = 15 * 60 * 1000 // 15 minutes

// ─── Auth configuration ───────────────────────────────────────────────────────
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        // ── 1. Validate input ─────────────────────────────────────────────
        const parsed = SignInSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        // ── 2. Rate limiting (per IP + email) ─────────────────────────────
        let ip = 'unknown'
        try {
          const hdrs = await headers()
          ip =
            hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ??
            hdrs.get('x-real-ip') ??
            'unknown'
        } catch { /* headers() unavailable in some contexts */ }

        const { success: rateLimitOk } = await loginRateLimiter.limit(`${ip}:${email}`)
        if (!rateLimitOk) return null

        // ── 3. Fetch user ─────────────────────────────────────────────────
        const user = await prisma.user.findUnique({ where: { email } })

        // ── 4. Timing-safe dummy verify when user not found ───────────────
        if (!user || !user.password) {
          await argon2.verify(DUMMY_HASH, password).catch(() => {})
          return null
        }

        // ── 5. Account lock check ─────────────────────────────────────────
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new AccountLockedError()
        }

        // ── 6. Soft-delete check ──────────────────────────────────────────
        if (user.deletedAt) return null

        // ── 7. isActive check ─────────────────────────────────────────────
        if (!user.isActive) return null

        // ── 8. Password verification ──────────────────────────────────────
        let validPassword = false
        try {
          validPassword = await argon2.verify(user.password, password)
        } catch { return null }

        if (!validPassword) {
          // Increment failed attempts; lock if threshold reached
          const newAttempts = user.failedLoginAttempts + 1
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: newAttempts,
              lockedUntil:
                newAttempts >= MAX_FAILED_ATTEMPTS
                  ? new Date(Date.now() + LOCK_DURATION_MS)
                  : null,
            },
          })
          return null
        }

        // ── 9. Email verification guard ───────────────────────────────────
        if (!user.emailVerified) {
          throw new EmailNotVerifiedError()
        }

        // ── 10. Role resolution — SpecialUser is source of truth ──────────
        const specialUser = await prisma.specialUser.findUnique({ where: { email } })
        const resolvedRole = specialUser?.role ?? 'STUDENT'

        // ── 11. Persist side-effects on successful login ──────────────────
        const needsRoleUpdate = user.role !== resolvedRole
        const needsApplied    = specialUser && !specialUser.appliedAt

        await prisma.user.update({
          where: { id: user.id },
          data: {
            role:               resolvedRole,
            name:               user.name  ?? DEFAULT_NAME,
            image:              user.image ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name ?? DEFAULT_NAME)}`,
            lastLoginAt:        new Date(),
            failedLoginAttempts: 0,
            lockedUntil:        null,
          },
        })

        if (needsApplied) {
          await prisma.specialUser
            .update({ where: { email }, data: { appliedAt: new Date() } })
            .catch(() => {})
        }

        return {
          id:               user.id,
          email:            user.email,
          name:             user.name  ?? DEFAULT_NAME,
          image:            user.image ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name ?? DEFAULT_NAME)}`,
          role:             resolvedRole,
          profileCompleted: user.profileCompleted,
          passwordChangedAt: user.passwordChangedAt?.getTime() ?? null,
        }
      },
    }),
  ],

  // ── Callbacks ─────────────────────────────────────────────────────────────
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // ── Initial sign-in: populate token from authorize() result ──────────
      if (user) {
        token.id               = user.id ?? token.sub ?? ''
        token.role             = (user as any).role
        token.profileCompleted = (user as any).profileCompleted
        token.name             = user.name             ?? DEFAULT_NAME
        token.email            = user.email            ?? ''
        token.picture          = user.image            ?? DEFAULT_IMAGE
        token.passwordChangedAt = (user as any).passwordChangedAt ?? null
        token.iat              = Math.floor(Date.now() / 1000)
      }

      // ── Explicit session update from the client ───────────────────────────
      if (trigger === 'update' && session) {
        if (session.name             !== undefined) token.name             = session.name
        if (session.image            !== undefined) token.picture          = session.image
        if (session.profileCompleted !== undefined) token.profileCompleted = session.profileCompleted
        if (session.role             !== undefined) token.role             = session.role
      }

      // ── Periodic re-validation (every token refresh, not just sign-in) ───
      // Re-check isActive, lockedUntil, and passwordChangedAt from DB
      // so that a disabled/locked account or a password change invalidates
      // the existing JWT within one updateAge window (5 min).
      if (token.id && !user) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              isActive:          true,
              deletedAt:         true,
              lockedUntil:       true,
              passwordChangedAt: true,
              role:              true,
              profileCompleted:  true,
            },
          })

          if (
            !dbUser ||
            !dbUser.isActive ||
            dbUser.deletedAt ||
            (dbUser.lockedUntil && dbUser.lockedUntil > new Date())
          ) {
            // Return an empty token — this causes NextAuth to end the session
            return {} as typeof token
          }

          // If password changed after token was issued, invalidate
          const tokenIat = (token.iat as number) ?? 0
          if (
            dbUser.passwordChangedAt &&
            dbUser.passwordChangedAt.getTime() / 1000 > tokenIat
          ) {
            return {} as typeof token
          }

          // Keep role and profileCompleted fresh from DB
          token.role             = dbUser.role
          token.profileCompleted = dbUser.profileCompleted
        } catch {
          // DB unreachable — keep existing token rather than logging everyone out
        }
      }

      return token
    },

    async session({ session, token }) {
      // If jwt() returned an empty token (invalidated), clear the session user
      if (!token.id) {
        return { ...session, user: undefined as any }
      }

      session.user.id               = token.id              as string
      session.user.role             = (token.role           as string)  ?? 'STUDENT'
      session.user.profileCompleted = (token.profileCompleted as boolean) ?? false
      session.user.name             = (token.name           as string)  ?? DEFAULT_NAME
      session.user.email            = (token.email          as string)  ?? ''
      session.user.image            = (token.picture        as string)  ?? DEFAULT_IMAGE
      return session
    },
  },

  // ── Session ───────────────────────────────────────────────────────────────
  session: {
    strategy:  'jwt',
    maxAge:    60 * 60 * 24,  // 24 hours absolute max
    updateAge: 60 * 5,        // re-validate every 5 minutes
  },

  // ── Secure cookies ─────────────────────────────────────────────────────────
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-authjs.session-token'
          : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path:     '/',
        secure:   process.env.NODE_ENV === 'production',
      },
    },
  },

  // ── Custom pages ───────────────────────────────────────────────────────────
  pages: {
    signIn: '/auth/signin',
    error:  '/auth/signin',
  },

  secret:    process.env.NEXTAUTH_SECRET,
  trustHost: true,
})
