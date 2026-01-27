import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import prisma from '@/lib/prisma'
import Google from 'next-auth/providers/google'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import type { Adapter } from 'next-auth/adapters'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    MicrosoftEntraID({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        // Check special user role and update if needed
        const specialUser = await prisma.specialUser.findUnique({
          where: { email: user.email! },
        })

        const assignedRole = specialUser?.role || 'STUDENT'

        // Update user role if it differs from special user role
        if (user.role !== assignedRole) {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: assignedRole },
          })
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: assignedRole,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false

      // Check for special user role assignment
      const specialUser = await prisma.specialUser.findUnique({
        where: { email: user.email },
      })

      const assignedRole = specialUser?.role || 'STUDENT'

      // For OAuth providers (Google, Microsoft)
      if (account?.provider !== 'credentials') {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        })

        if (existingUser) {
          // Update existing user's role if it differs
          if (existingUser.role !== assignedRole) {
            await prisma.user.update({
              where: { email: user.email },
              data: { role: assignedRole },
            })
          }
        } else {
          // New OAuth user - will be created by PrismaAdapter
          // We'll update the role immediately after creation
          await prisma.user.upsert({
            where: { email: user.email },
            update: { role: assignedRole },
            create: {
              email: user.email,
              name: user.name || '',
              image: user.image,
              role: assignedRole,
            },
          })
        }
      }

      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role
      }

      // Check and update role on each token refresh
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        })

        if (dbUser) {
          token.role = dbUser.role
          token.name = dbUser.name
          token.picture = dbUser.image
        }
      }

      if (trigger === 'update' && session) {
        token = { ...token, ...session }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.image = token.picture as string
      }

      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
})