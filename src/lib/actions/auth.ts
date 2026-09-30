'use server'

import { signIn, signOut } from '@/lib/auth'
import { SignUpSchema, SetupProfileSchema, ForgotPasswordSchema, ResetPasswordSchema } from '@/lib/validations/auth'
import prisma from '@/lib/prisma'
import argon2 from 'argon2'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { loginRateLimiter, registerRateLimiter } from '@/lib/rate-limiter'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { generateVerificationToken, generatePasswordResetToken } from '@/lib/tokens'
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/mail'

const DEFAULT_NAME = 'New User'

// ── Login action ──────────────────────────────────────────────────────────────
export async function loginAction(formData: FormData) {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // Turnstile
  const turnstileToken = formData.get('turnstileToken') as string
  if (!turnstileToken) return { error: 'CAPTCHA is required' }
  const isHuman = await verifyTurnstileToken(turnstileToken)
  if (!isHuman) return { error: 'Invalid CAPTCHA' }

  const ip = (await headers()).get('x-forwarded-for') ?? 'unknown'
  const rateLimitKey = `${ip}:${raw.email}`
  const { success: allowed } = await loginRateLimiter.limit(rateLimitKey)
  if (!allowed) return { error: 'Too many login attempts. Please try again later.' }

  try {
    await signIn('credentials', {
      email: raw.email,
      password: raw.password,
      redirect: false,
    })
    return { success: true }
  } catch (error: any) {
    if (error?.message?.includes('NEXT_REDIRECT')) {
      throw error
    }
    
    const errCode = error?.cause?.err?.code || error?.type || error?.message
    
    if (errCode === 'Email not verified') {
      return { error: 'Please verify your email before logging in.' }
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
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
    turnstileToken: formData.get('turnstileToken') as string,
  }

  // Validate Turnstile first
  if (!raw.turnstileToken) return { error: 'CAPTCHA is required' }
  const isHuman = await verifyTurnstileToken(raw.turnstileToken)
  if (!isHuman) return { error: 'Invalid CAPTCHA' }

  const ip = (await headers()).get('x-forwarded-for') ?? 'unknown'
  const { success: allowed } = await registerRateLimiter.limit(ip)
  if (!allowed) return { error: 'Too many registration attempts. Please try again later.' }

  // Validate form data
  const parsed = SignUpSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { name, email, password } = parsed.data

  // Duplicate check
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: 'Unable to create account. Please try a different email.' }
  }

  // Role from SpecialUser (strictly enforced server-side)
  const specialUser = await prisma.specialUser.findUnique({ where: { email } })
  const role = specialUser?.role ?? 'STUDENT'

  // Hash
  const hashedPassword = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  })

  const displayName = name || DEFAULT_NAME
  const fallbackImage = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`

  // Create user
  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: displayName,
      image: fallbackImage,
      role,
      profileCompleted: false,
    },
  })

  // Generate Verification Token and send Email via Resend
  try {
    const verificationToken = await generateVerificationToken(email)
    await sendVerificationEmail(email, verificationToken.token)
  } catch (err) {
    console.error('Failed to send verification email:', err)
    return { error: 'Account created, but failed to send verification email. Please contact support.' }
  }

  return { success: true, message: 'Confirmation email sent. Please check your inbox.' }
}

// ── Setup profile action ──────────────────────────────────────────────────────
// Returns {success:true} or {error:string} — caller handles navigation.
// DO NOT call redirect() here; it gets swallowed by client-side try/catch.
export async function setupProfileAction(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Not authenticated. Please sign in again.' }

    const raw = {
      name: formData.get('name') as string,
      bio: (formData.get('bio') as string) || undefined,
      department: (formData.get('department') as string) || undefined,
      phone: (formData.get('phone') as string) || undefined,
      image: (formData.get('image') as string) || undefined,
      coverImage: (formData.get('coverImage') as string) || undefined,
      institution: (formData.get('institution') as string) || undefined,
      linkedinLink: (formData.get('linkedinLink') as string) || undefined,
      skills: (formData.get('skills') as string) || undefined,
      enrollmentNo: (formData.get('enrollmentNo') as string) || undefined,
      degree: (formData.get('degree') as string) || undefined,
      currentYear: (formData.get('currentYear') as string) || undefined,
      currentSemester: (formData.get('currentSemester') as string) || undefined,
      graduationYear: (formData.get('graduationYear') as string) || undefined,
      resumeLink: (formData.get('resumeLink') as string) || undefined,
      portfolioLink: (formData.get('portfolioLink') as string) || undefined,
      githubLink: (formData.get('githubLink') as string) || undefined,
      researchInterests: (formData.get('researchInterests') as string) || undefined,
      designation: (formData.get('designation') as string) || undefined,
      yearsOfExperience: (formData.get('yearsOfExperience') as string) || undefined,
      areasOfExpertise: (formData.get('areasOfExpertise') as string) || undefined,
      orcidId: (formData.get('orcidId') as string) || undefined,
    }

    const parsed = SetupProfileSchema.safeParse(raw)
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
    }

    const { 
      name, bio, department, phone, image, coverImage, institution, linkedinLink, 
      skills, enrollmentNo, degree, currentYear, currentSemester, graduationYear, 
      resumeLink, portfolioLink, githubLink, researchInterests, 
      designation, yearsOfExperience, areasOfExpertise, orcidId 
    } = parsed.data

    const displayName = name || DEFAULT_NAME
    const fallbackImage = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`

    // Helper to split comma-separated strings to arrays
    const toArray = (str?: string) => str ? str.split(',').map(s => s.trim()).filter(Boolean) : []

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: displayName,
        bio,
        department,
        phone: phone || null,
        image: image || fallbackImage,
        profileCompleted: true,
        coverImage,
        institution,
        linkedinLink,
        skills: toArray(skills),
        enrollmentNo,
        degree,
        currentYear,
        currentSemester,
        graduationYear,
        resumeLink,
        portfolioLink,
        githubLink,
        researchInterests: toArray(researchInterests),
        designation,
        yearsOfExperience,
        areasOfExpertise: toArray(areasOfExpertise),
        orcidId,
      },
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    console.error('[setupProfileAction]', err)
    return { error: 'Failed to save profile. Please try again.' }
  }
}

// ── Skip profile setup action ─────────────────────────────────────────────────
// Returns {success:true} or {error:string} — caller handles navigation.
export async function skipProfileSetupAction(): Promise<{ success: true } | { error: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Not authenticated. Please sign in again.' }

    // Mark as complete even when skipped — prevents the middleware redirect loop
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

// ── Verify Email Action ───────────────────────────────────────────────────────
export async function verifyEmailAction(token: string): Promise<{ success: true; message: string } | { error: string }> {
  try {
    const existingToken = await prisma.verificationToken.findFirst({
      where: { token }
    });

    if (!existingToken) return { error: 'Token does not exist!' };

    const hasExpired = new Date(existingToken.expires) < new Date();
    if (hasExpired) return { error: 'Token has expired!' };

    const existingUser = await prisma.user.findUnique({
      where: { email: existingToken.identifier }
    });

    if (!existingUser) return { error: 'Email does not exist!' };

    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        emailVerified: new Date(),
        email: existingToken.identifier,
      }
    });

    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: existingToken.identifier,
          token: existingToken.token,
        }
      }
    });

    return { success: true, message: 'Email verified successfully!' };
  } catch (error) {
    console.error('[verifyEmailAction]', error);
    return { error: 'Failed to verify email.' };
  }
}

// ── Forgot Password Action ────────────────────────────────────────────────────
export async function forgotPasswordAction(formData: FormData): Promise<{ success: true; message: string } | { error: string }> {
  try {
    const email = formData.get('email') as string
    const turnstileToken = formData.get('turnstileToken') as string

    const parsed = ForgotPasswordSchema.safeParse({ email, turnstileToken })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

    if (!turnstileToken) return { error: 'CAPTCHA is required' }
    const isHuman = await verifyTurnstileToken(turnstileToken)
    if (!isHuman) return { error: 'Invalid CAPTCHA' }

    // Rate limiting
    const ip = (await headers()).get('x-forwarded-for') ?? 'unknown'
    const { success: allowed } = await loginRateLimiter.limit(`forgot:${ip}`)
    if (!allowed) return { error: 'Too many requests. Please try again later.' }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email }
    })

    if (!user || !user.password) {
      // Do not reveal if the user exists or not
      return { success: true, message: 'If an account exists with that email, a password reset link has been sent.' }
    }

    const resetToken = await generatePasswordResetToken(user.email!)
    await sendPasswordResetEmail(user.email!, resetToken.token)

    return { success: true, message: 'If an account exists with that email, a password reset link has been sent.' }
  } catch (error) {
    console.error('[forgotPasswordAction]', error)
    return { error: 'Something went wrong. Please try again.' }
  }
}

// ── Reset Password Action ─────────────────────────────────────────────────────
export async function resetPasswordAction(formData: FormData): Promise<{ success: true; message: string } | { error: string }> {
  try {
    const raw = {
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
      token: formData.get('token') as string,
    }

    const parsed = ResetPasswordSchema.safeParse(raw)
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
    }

    const existingToken = await prisma.passwordResetToken.findFirst({
      where: { token: parsed.data.token }
    })

    if (!existingToken) return { error: 'Invalid token!' }

    const hasExpired = new Date(existingToken.expires) < new Date()
    if (hasExpired) return { error: 'Token has expired!' }

    const user = await prisma.user.findUnique({
      where: { email: existingToken.identifier }
    })

    if (!user) return { error: 'Email does not exist!' }

    const hashedPassword = await argon2.hash(parsed.data.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    })

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    await prisma.passwordResetToken.delete({
      where: {
        identifier_token: {
          identifier: existingToken.identifier,
          token: existingToken.token,
        }
      }
    })

    return { success: true, message: 'Password reset successfully!' }
  } catch (error) {
    console.error('[resetPasswordAction]', error)
    return { error: 'Failed to reset password.' }
  }
}

// ── Change Password Action (for logged in users) ──────────────────────────────
export async function changePasswordAction(formData: FormData): Promise<{ success: true; message: string } | { error: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Not authenticated.' }
    }

    const currentPassword = formData.get('currentPassword') as string
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!currentPassword || !newPassword || !confirmPassword) {
      return { error: 'All fields are required.' }
    }

    if (newPassword !== confirmPassword) {
      return { error: 'New passwords do not match.' }
    }

    if (newPassword.length < 8) {
      return { error: 'Password must be at least 8 characters long.' }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || !user.password) {
      return { error: 'User not found or password not set.' }
    }

    const isValid = await argon2.verify(user.password, currentPassword)
    if (!isValid) {
      return { error: 'Incorrect current password.' }
    }

    const hashedPassword = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    })

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    })

    return { success: true, message: 'Password updated successfully!' }
  } catch (error) {
    console.error('[changePasswordAction]', error)
    return { error: 'Failed to change password.' }
  }
}

