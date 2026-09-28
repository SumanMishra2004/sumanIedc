'use server'

import { signIn, signOut } from '@/lib/auth'
import {
  SignUpSchema,
  SetupProfileSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from '@/lib/validations/auth'
import prisma from '@/lib/prisma'
import argon2 from 'argon2'
import { createHash } from 'crypto'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { loginRateLimiter, registerRateLimiter } from '@/lib/rate-limiter'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { generateVerificationToken, generatePasswordResetToken } from '@/lib/tokens'
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/mail'

const DEFAULT_NAME = 'New User'

function sha256(raw: string) {
  return createHash('sha256').update(raw).digest('hex')
}

// ── Login action ──────────────────────────────────────────────────────────────
export async function loginAction(formData: FormData) {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const turnstileToken = formData.get('turnstileToken') as string
  if (!turnstileToken) return { error: 'CAPTCHA is required' }
  const isHuman = await verifyTurnstileToken(turnstileToken)
  if (!isHuman) return { error: 'Invalid CAPTCHA' }

  const ip = (await headers()).get('x-forwarded-for') ?? 'unknown'
  const { success: allowed } = await loginRateLimiter.limit(`${ip}:${raw.email}`)
  if (!allowed) return { error: 'Too many login attempts. Please try again later.' }

  try {
    await signIn('credentials', {
      email: raw.email,
      password: raw.password,
      redirect: false,
    })
    return { success: true }
  } catch (error: any) {
    if (error?.message?.includes('NEXT_REDIRECT')) throw error

    const errCode = error?.cause?.err?.code || error?.type || error?.message
    if (errCode === 'Email not verified') {
      return { error: 'Please verify your email before logging in.' }
    }
    if (errCode === 'Account locked') {
      return { error: 'Your account is temporarily locked. Please try again later.' }
    }
    return { error: 'Invalid email or password.' }
  }
}

// ── Logout action ─────────────────────────────────────────────────────────────
export async function logoutAction() {
  await signOut({ redirectTo: '/auth/signin' })
}

// ── Register action ───────────────────────────────────────────────────────────
export async function registerAction(formData: FormData) {
  const raw = {
    name:             formData.get('name') as string,
    email:            formData.get('email') as string,
    password:         formData.get('password') as string,
    confirmPassword:  formData.get('confirmPassword') as string,
    turnstileToken:   formData.get('turnstileToken') as string,
  }

  if (!raw.turnstileToken) return { error: 'CAPTCHA is required' }
  const isHuman = await verifyTurnstileToken(raw.turnstileToken)
  if (!isHuman) return { error: 'Invalid CAPTCHA' }

  const ip = (await headers()).get('x-forwarded-for') ?? 'unknown'
  const { success: allowed } = await registerRateLimiter.limit(ip)
  if (!allowed) return { error: 'Too many registration attempts. Please try again later.' }

  const parsed = SignUpSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { name, email, password } = parsed.data

  // Duplicate check — generic message to avoid enumeration
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: 'Unable to create account. Please try a different email.' }
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

  const displayName = name || DEFAULT_NAME
  const fallbackImage = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: displayName,
      image: fallbackImage,
      role,
      profileCompleted: false,
      // emailVerified intentionally null — enforced in authorize()
    },
    select: { id: true, email: true },
  })

  // Mark SpecialUser.appliedAt if applicable
  if (specialUser && !specialUser.appliedAt) {
    await prisma.specialUser.update({
      where: { email },
      data: { appliedAt: new Date() },
    }).catch(() => { /* non-fatal */ })
  }

  // Send verification email
  try {
    const { rawToken } = await generateVerificationToken(user.id, ip)
    await sendVerificationEmail(user.email, rawToken)
  } catch (err) {
    console.error('[registerAction] Failed to send verification email:', err)
    // User is created — don't hard-fail; they can request resend later
    return {
      success: true,
      message: 'Account created, but we could not send the verification email. Please contact support.',
    }
  }

  return { success: true, message: 'Check your email to verify your account.' }
}

// ── Verify Email Action ───────────────────────────────────────────────────────
export async function verifyEmailAction(
  rawToken: string,
): Promise<{ success: true; message: string } | { error: string }> {
  try {
    if (!rawToken || rawToken.length < 64) return { error: 'Invalid verification link.' }

    const tokenHash = sha256(rawToken)

    const record = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, email: true, emailVerified: true } } },
    })

    if (!record)  return { error: 'Verification link is invalid or has already been used.' }
    if (record.usedAt) return { error: 'This verification link has already been used.' }
    if (record.expires < new Date()) return { error: 'Verification link has expired. Please request a new one.' }

    // Mark token used + verify user email atomically
    await prisma.$transaction([
      prisma.emailVerificationToken.update({
        where: { tokenHash },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: new Date() },
      }),
    ])

    return { success: true, message: 'Email verified successfully! You can now sign in.' }
  } catch (error) {
    console.error('[verifyEmailAction]', error)
    return { error: 'Failed to verify email. Please try again.' }
  }
}

// ── Forgot Password Action ────────────────────────────────────────────────────
export async function forgotPasswordAction(
  formData: FormData,
): Promise<{ success: true; message: string } | { error: string }> {
  try {
    const email          = (formData.get('email') as string)?.toLowerCase().trim()
    const turnstileToken = formData.get('turnstileToken') as string

    const parsed = ForgotPasswordSchema.safeParse({ email, turnstileToken })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

    if (!turnstileToken) return { error: 'CAPTCHA is required' }
    const isHuman = await verifyTurnstileToken(turnstileToken)
    if (!isHuman) return { error: 'Invalid CAPTCHA' }

    const ip = (await headers()).get('x-forwarded-for') ?? 'unknown'
    const { success: allowed } = await loginRateLimiter.limit(`forgot:${ip}`)
    if (!allowed) return { error: 'Too many requests. Please try again later.' }

    // Always return the same message — prevents email enumeration
    const SAFE_MSG = 'If an account exists with that email, a password reset link has been sent.'

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, email: true, password: true, isActive: true, deletedAt: true },
    })
    if (!user || !user.password || !user.isActive || user.deletedAt) return { success: true, message: SAFE_MSG }

    const { rawToken } = await generatePasswordResetToken(user.id, ip)
    await sendPasswordResetEmail(user.email, rawToken)

    return { success: true, message: SAFE_MSG }
  } catch (error) {
    console.error('[forgotPasswordAction]', error)
    return { error: 'Something went wrong. Please try again.' }
  }
}

// ── Reset Password Action ─────────────────────────────────────────────────────
export async function resetPasswordAction(
  formData: FormData,
): Promise<{ success: true; message: string } | { error: string }> {
  try {
    const raw = {
      password:        formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
      token:           formData.get('token') as string,
    }

    const parsed = ResetPasswordSchema.safeParse(raw)
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

    const tokenHash = sha256(parsed.data.token)

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true } } },
    })

    if (!record)         return { error: 'Invalid or expired reset link.' }
    if (record.usedAt)   return { error: 'This reset link has already been used.' }
    if (record.expires < new Date()) return { error: 'Reset link has expired. Please request a new one.' }

    const hashedPassword = await argon2.hash(parsed.data.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    })

    // Mark token used + update password + set passwordChangedAt atomically
    await prisma.$transaction([
      prisma.passwordResetToken.update({
        where: { tokenHash },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: record.userId },
        data: {
          password:          hashedPassword,
          passwordChangedAt: new Date(),
          // Clear any account lockout on successful password reset
          failedLoginAttempts: 0,
          lockedUntil:         null,
        },
      }),
    ])

    return { success: true, message: 'Password reset successfully. You can now sign in.' }
  } catch (error) {
    console.error('[resetPasswordAction]', error)
    return { error: 'Failed to reset password. Please try again.' }
  }
}

// ── Change Password Action (logged-in users) ──────────────────────────────────
export async function changePasswordAction(
  formData: FormData,
): Promise<{ success: true; message: string } | { error: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Not authenticated.' }

    const currentPassword  = formData.get('currentPassword') as string
    const newPassword      = formData.get('newPassword') as string
    const confirmPassword  = formData.get('confirmPassword') as string

    if (!currentPassword || !newPassword || !confirmPassword) {
      return { error: 'All fields are required.' }
    }
    if (newPassword !== confirmPassword) {
      return { error: 'New passwords do not match.' }
    }
    if (newPassword.length < 8) {
      return { error: 'Password must be at least 8 characters.' }
    }
    if (!/[A-Z]/.test(newPassword)) {
      return { error: 'Password must contain at least one uppercase letter.' }
    }
    if (!/[0-9]/.test(newPassword)) {
      return { error: 'Password must contain at least one number.' }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    })
    if (!user?.password) return { error: 'User not found.' }

    const isValid = await argon2.verify(user.password, currentPassword)
    if (!isValid) return { error: 'Incorrect current password.' }

    const hashed = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    })

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password:          hashed,
        passwordChangedAt: new Date(),   // used to invalidate existing JWTs
      },
    })

    return { success: true, message: 'Password updated successfully.' }
  } catch (error) {
    console.error('[changePasswordAction]', error)
    return { error: 'Failed to change password.' }
  }
}

// ── Setup Profile Action ──────────────────────────────────────────────────────
export async function setupProfileAction(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Not authenticated. Please sign in again.' }

    const raw = {
      name:              formData.get('name') as string,
      bio:               (formData.get('bio') as string)               || undefined,
      department:        (formData.get('department') as string)        || undefined,
      phone:             (formData.get('phone') as string)             || undefined,
      image:             (formData.get('image') as string)             || undefined,
      coverImage:        (formData.get('coverImage') as string)        || undefined,
      institution:       (formData.get('institution') as string)       || undefined,
      linkedinLink:      (formData.get('linkedinLink') as string)      || undefined,
      skills:            (formData.get('skills') as string)            || undefined,
      enrollmentNo:      (formData.get('enrollmentNo') as string)      || undefined,
      degree:            (formData.get('degree') as string)            || undefined,
      currentYear:       (formData.get('currentYear') as string)       || undefined,
      currentSemester:   (formData.get('currentSemester') as string)   || undefined,
      graduationYear:    (formData.get('graduationYear') as string)    || undefined,
      resumeLink:        (formData.get('resumeLink') as string)        || undefined,
      portfolioLink:     (formData.get('portfolioLink') as string)     || undefined,
      githubLink:        (formData.get('githubLink') as string)        || undefined,
      researchInterests: (formData.get('researchInterests') as string) || undefined,
      designation:       (formData.get('designation') as string)       || undefined,
      yearsOfExperience: (formData.get('yearsOfExperience') as string) || undefined,
      areasOfExpertise:  (formData.get('areasOfExpertise') as string)  || undefined,
      orcidId:           (formData.get('orcidId') as string)           || undefined,
    }

    const parsed = SetupProfileSchema.safeParse(raw)
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
    }

    const {
      name, bio, department, phone, image, coverImage, institution, linkedinLink,
      skills, enrollmentNo, degree, currentYear, currentSemester, graduationYear,
      resumeLink, portfolioLink, githubLink, researchInterests,
      designation, yearsOfExperience, areasOfExpertise, orcidId,
    } = parsed.data

    const displayName   = name || DEFAULT_NAME
    const fallbackImage = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`

    const toArray = (s?: string) =>
      s ? s.split(',').map((x) => x.trim()).filter(Boolean) : []

    const toInt = (s?: string): number | undefined => {
      const n = parseInt(s ?? '', 10)
      return isNaN(n) ? undefined : n
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name:             displayName,
        bio,
        department,
        phone:            phone || null,
        image:            image || fallbackImage,
        coverImage:       coverImage || null,
        institution,
        linkedinLink:     linkedinLink || null,
        skills:           toArray(skills),
        enrollmentNo,
        degree,
        currentYear:      toInt(currentYear),
        currentSemester:  toInt(currentSemester),
        graduationYear:   toInt(graduationYear),
        resumeLink:       resumeLink || null,
        portfolioLink:    portfolioLink || null,
        githubLink:       githubLink || null,
        researchInterests: toArray(researchInterests),
        designation,
        yearsOfExperience: toInt(yearsOfExperience),
        areasOfExpertise:  toArray(areasOfExpertise),
        orcidId,
        profileCompleted: true,
      },
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    console.error('[setupProfileAction]', err)
    return { error: 'Failed to save profile. Please try again.' }
  }
}

// ── Skip Profile Setup ────────────────────────────────────────────────────────
export async function skipProfileSetupAction(): Promise<
  { success: true } | { error: string }
> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Not authenticated. Please sign in again.' }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { profileCompleted: true },
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    console.error('[skipProfileSetupAction]', err)
    return { error: 'Something went wrong. Please try again.' }
  }
}
