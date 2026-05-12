import NextAuth, { CredentialsSignin } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import prisma from '@/lib/prisma'
import argon2 from 'argon2'
import type { Adapter } from 'next-auth/adapters'
import { SignInSchema } from '@/lib/validations/auth'
import { loginRateLimiter } from '@/lib/rate-limiter'
import { headers } from 'next/headers'

const DEFAULT_NAME = 'New User'
const DEFAULT_IMAGE = 'https://api.dicebear.com/7.x/initials/svg?seed=User'

class EmailNotVerifiedError extends CredentialsSignin {
  code = "Email not verified"
}

/**
 * A valid-format Argon2id hash of a dummy string.
 * Used to prevent timing attacks when the user doesn't exist.
 * Run: node -e "require('argon2').hash('dummy').then(console.log)"
 */
const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$kWFTIyR6RhqkKxPjU2Lp8g$W5Mzj4WZGhU6i3mxjWPBqvX8Q+N1OJQfzG3P7jxsaoc'

// ─── Auth configuration ───────────────────────────────────────────────────────
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Use PrismaAdapter but force JWT strategy — adapter is only used for DB
  // writes via signUp / linkAccount, NOT for session storage.
  adapter: PrismaAdapter(prisma) as Adapter,

  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        // ── 1. Zod validation ─────────────────────────────────────────────
        const parsed = SignInSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        // ── 2. Rate limiting ──────────────────────────────────────────────
        // Derive IP from Next.js request headers
        let ip = 'unknown'
        try {
          const hdrs = await headers()
          ip =
            hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ??
            hdrs.get('x-real-ip') ??
            'unknown'
        } catch {
          // headers() not available in some contexts — silently fall through
        }

        const rateLimitKey = `${ip}:${email}`
        const { success: allowed } = await loginRateLimiter.limit(rateLimitKey)

        if (!allowed) {
          // Return null — the caller will receive an "CredentialsSignin" error
          // which we map to a generic message to avoid enumeration
          return null
        }

        // ── 3. Find user ──────────────────────────────────────────────────
        const user = await prisma.user.findUnique({ where: { email } })

        // ── 4. Timing-safe dummy verification when user not found ─────────
        if (!user || !user.password) {
          try {
            // Always run verify to prevent timing difference revealing existence
            await argon2.verify(DUMMY_HASH, password)
          } catch {
            /* expected to fail */
          }
          return null
        }

        // ── 5. Real password verification ─────────────────────────────────
        let validPassword = false
        try {
          validPassword = await argon2.verify(user.password, password)
        } catch {
          return null
        }

        if (!validPassword) return null

        // ── 6. Check Email Verification ───────────────────────────────────
        if (!user.emailVerified) {
          throw new EmailNotVerifiedError()
        }

        // ── 7. Role resolution — check SpecialUser table ──────────────────
        const specialUser = await prisma.specialUser.findUnique({
          where: { email },
        })

        const resolvedRole = specialUser ? specialUser.role : 'STUDENT'

        // ── 7. Persist resolved role & fallback values to DB if changed ───
        const needsUpdate =
          user.role !== resolvedRole ||
          !user.name ||
          !user.image

        if (needsUpdate) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              role: resolvedRole,
              name: user.name ?? DEFAULT_NAME,
              image:
                user.image ??
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  user.name ?? DEFAULT_NAME,
                )}`,
            },
          })
        }

        return {
          id: user.id,
          email: user.email ?? '',
          name: user.name ?? DEFAULT_NAME,
          image:
            user.image ??
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
              user.name ?? DEFAULT_NAME,
            )}`,
          role: resolvedRole,
          profileCompleted: user.profileCompleted,
        }
      },
    }),
  ],

  // ── JWT & Session callbacks ────────────────────────────────────────────────
  callbacks: {
    /**
     * jwt() is called on sign-in (user is present) and on every session read.
     * We persist all required fields into the token here.
     */
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // Initial sign-in — populate from authorize() return value
        token.id = user.id ?? token.sub ?? ''
        token.role = user.role
        token.profileCompleted = user.profileCompleted
        token.name = user.name ?? DEFAULT_NAME
        token.email = user.email ?? ''
        token.picture =
          user.image ??
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
            user.name ?? DEFAULT_NAME,
          )}`
      }

      // Handle explicit session updates from the client
      if (trigger === 'update' && session) {
        token.name = session.name ?? token.name
        token.picture = session.image ?? token.picture
        token.profileCompleted = session.profileCompleted ?? token.profileCompleted
      }

      return token
    },

    /**
     * session() is called whenever a session is checked.
     * We project the token fields into the session so client components
     * always receive a fully typed, non-nullable session.user.
     */
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = (token.role as string) ?? 'STUDENT'
      session.user.profileCompleted = (token.profileCompleted as boolean) ?? false
      session.user.name = (token.name as string) ?? DEFAULT_NAME
      session.user.email = (token.email as string) ?? ''
      session.user.image =
        (token.picture as string) ??
        DEFAULT_IMAGE
      return session
    },
  },

  // ── Session strategy ──────────────────────────────────────────────────────
  session: {
    strategy: 'jwt',
    maxAge: 60 * 15,      // 15 minutes
    updateAge: 60 * 5,    // refresh every 5 minutes
  },

  // ── Secure cookies ────────────────────────────────────────────────────────
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-authjs.session-token'
          : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  // ── Custom pages ──────────────────────────────────────────────────────────
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },

  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
})
