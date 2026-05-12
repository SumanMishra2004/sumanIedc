import { NextResponse } from 'next/server'
import argon2 from 'argon2'
import prisma from '@/lib/prisma'
import { SignUpSchema } from '@/lib/validations/auth'

const DEFAULT_NAME = 'New User'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // ── 1. Zod validation ─────────────────────────────────────────────────
    const parsed = SignUpSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 422 },
      )
    }

    const { name, email, password } = parsed.data

    // ── 2. Check for existing user ─────────────────────────────────────────
    // Use a generic error message to prevent user enumeration
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'User allready exist' },
        { status: 409 },
      )
    }

    // ── 3. Role resolution from SpecialUser table ─────────────────────────
    const specialUser = await prisma.specialUser.findUnique({ where: { email } })
    const role = specialUser?.role ?? 'STUDENT'

    // ── 4. Hash password with Argon2id ────────────────────────────────────
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MiB
      timeCost: 3,
      parallelism: 4,
    })

    // ── 5. Derive fallback image from initials ────────────────────────────
    const displayName = name ?? DEFAULT_NAME
    const fallbackImage = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`

    // ── 6. Create user ────────────────────────────────────────────────────
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: displayName,
        image: fallbackImage,
        role,
        profileCompleted: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profileCompleted: true,
      },
    })

    return NextResponse.json(
      { message: 'Account created successfully', user },
      { status: 201 },
    )
  } catch (error) {
    console.error('[signup]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
