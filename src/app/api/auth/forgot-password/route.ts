/**
 * POST /api/auth/forgot-password
 *
 * Accepts { email } and sends a password-reset link.
 * Always returns 200 with the same message to prevent email enumeration.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createHash } from 'crypto'
import { Ratelimit } from '@upstash/ratelimit'
import { redis } from '@/lib/redis'
import prisma from '@/lib/prisma'
import { generatePasswordResetToken } from '@/lib/tokens'
import { sendPasswordResetEmail } from '@/lib/mail'

const schema = z.object({
  email: z.string().email('Invalid email').toLowerCase().trim(),
})

const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  prefix: 'ratelimit:forgot-password',
})

const SAFE_MSG = 'If an account exists with that email, a password reset link has been sent.'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

    const { success: allowed } = await rateLimiter.limit(ip)
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 422 })
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, email: true, password: true, isActive: true, deletedAt: true },
    })

    // Always respond with the same message — no enumeration
    if (!user || !user.password || !user.isActive || user.deletedAt) {
      return NextResponse.json({ message: SAFE_MSG }, { status: 200 })
    }

    const { rawToken } = await generatePasswordResetToken(user.id, ip)
    await sendPasswordResetEmail(user.email, rawToken)

    return NextResponse.json({ message: SAFE_MSG }, { status: 200 })
  } catch (error) {
    console.error('[POST /api/auth/forgot-password]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
