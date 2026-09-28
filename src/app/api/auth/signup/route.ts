/**
 * POST /api/auth/signup
 *
 * REST signup endpoint (used by external clients / mobile apps).
 * UI signup goes through the registerAction server action instead.
 *
 * Does NOT require a Turnstile token (server-to-server calls can't complete CAPTCHA).
 * Does NOT pre-verify the email — email verification is always required.
 */

import { NextRequest, NextResponse } from 'next/server'
import argon2 from 'argon2'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { generateVerificationToken } from '@/lib/tokens'
import { sendVerificationEmail } from '@/lib/mail'

const DEFAULT_NAME = 'New User'

// Stripped-down schema for the REST endpoint (no Turnstile, no confirmPassword)
const ApiSignUpSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name is too long')
    .trim(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const parsed = ApiSignUpSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 422 },
      )
    }

    const { name, email, password } = parsed.data

    // Generic duplicate error to avoid enumeration
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Unable to create account.' },
        { status: 409 },
      )
    }

    // Role from SpecialUser table
    const specialUser = await prisma.specialUser.findUnique({ where: { email } })
    const role = specialUser?.role ?? 'STUDENT'

    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    })

    const displayName   = name ?? DEFAULT_NAME
    const fallbackImage = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: displayName,
        image: fallbackImage,
        role,
        profileCompleted: false,
        // emailVerified intentionally null — must verify before sign-in
      },
      select: { id: true, email: true, name: true, role: true, profileCompleted: true },
    })

    // Mark SpecialUser.appliedAt
    if (specialUser && !specialUser.appliedAt) {
      await prisma.specialUser
        .update({ where: { email }, data: { appliedAt: new Date() } })
        .catch(() => {})
    }

    // Send verification email (best-effort — user row is already created)
    const ip = req.headers.get('x-forwarded-for') ?? undefined
    try {
      const { rawToken } = await generateVerificationToken(user.id, ip)
      await sendVerificationEmail(user.email, rawToken)
    } catch (err) {
      console.error('[signup API] Failed to send verification email:', err)
      // Don't fail the response — user can request resend
    }

    return NextResponse.json(
      {
        message: 'Account created. Please check your email to verify your account.',
        user,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[signup API]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
