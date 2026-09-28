/**
 * POST /api/auth/reset-password
 *
 * Accepts { token, password, confirmPassword } and resets the user's password.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createHash } from 'crypto'
import argon2 from 'argon2'
import { Ratelimit } from '@upstash/ratelimit'
import { redis } from '@/lib/redis'
import prisma from '@/lib/prisma'

const schema = z
  .object({
    token:           z.string().min(64, 'Invalid token'),
    password:        z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128)
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '15 m'),
  prefix: 'ratelimit:reset-password',
})

function sha256(raw: string) {
  return createHash('sha256').update(raw).digest('hex')
}

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
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 422 },
      )
    }

    const tokenHash = sha256(parsed.data.token)

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true } } },
    })

    if (!record)       return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 })
    if (record.usedAt) return NextResponse.json({ error: 'This reset link has already been used.' }, { status: 400 })
    if (record.expires < new Date()) return NextResponse.json({ error: 'Reset link has expired.' }, { status: 400 })

    const hashed = await argon2.hash(parsed.data.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    })

    await prisma.$transaction([
      prisma.passwordResetToken.update({
        where: { tokenHash },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: record.userId },
        data: {
          password:            hashed,
          passwordChangedAt:   new Date(),
          failedLoginAttempts: 0,
          lockedUntil:         null,
        },
      }),
    ])

    return NextResponse.json({ message: 'Password reset successfully. You can now sign in.' })
  } catch (error) {
    console.error('[POST /api/auth/reset-password]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
