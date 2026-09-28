/**
 * @file tokens.ts
 * Token generation for email verification and password reset.
 *
 * Schema facts:
 *  - EmailVerificationToken: { id, userId, tokenHash (SHA-256), expires, usedAt }
 *  - PasswordResetToken:     { id, userId, tokenHash (SHA-256), expires, usedAt, ipAddress }
 *
 * We generate a cryptographically random raw token, send it in the email,
 * but only store its SHA-256 hash in the database.
 */

import { randomBytes, createHash } from 'crypto'
import prisma from '@/lib/prisma'

/** Validity windows */
const EMAIL_VERIFY_TTL_MS = 60 * 60 * 1000       // 1 hour
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000     // 1 hour

/** SHA-256 hex of a raw token string */
function sha256(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

/** Generate a 48-byte (96-char hex) URL-safe token */
function generateRawToken(): string {
  return randomBytes(48).toString('hex')
}

// ─── Email Verification ────────────────────────────────────────────────────────

export interface VerificationTokenResult {
  /** The raw token to embed in the verification link — NEVER stored in DB */
  rawToken: string
  expires: Date
}

/**
 * Creates (or replaces) an email-verification token for a given user.
 * Returns the raw token so the caller can embed it in the link.
 */
export async function generateVerificationToken(
  userId: string,
  ipAddress?: string | null,
): Promise<VerificationTokenResult> {
  // Delete any existing tokens for this user
  await prisma.emailVerificationToken.deleteMany({ where: { userId } })

  const rawToken = generateRawToken()
  const tokenHash = sha256(rawToken)
  const expires = new Date(Date.now() + EMAIL_VERIFY_TTL_MS)

  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash, expires },
  })

  return { rawToken, expires }
}

// ─── Password Reset ────────────────────────────────────────────────────────────

export interface PasswordResetTokenResult {
  /** The raw token to embed in the reset link — NEVER stored in DB */
  rawToken: string
  expires: Date
}

/**
 * Creates (or replaces) a password-reset token for a given user.
 * Returns the raw token so the caller can embed it in the link.
 */
export async function generatePasswordResetToken(
  userId: string,
  ipAddress?: string | null,
): Promise<PasswordResetTokenResult> {
  // Delete any existing tokens for this user
  await prisma.passwordResetToken.deleteMany({ where: { userId } })

  const rawToken = generateRawToken()
  const tokenHash = sha256(rawToken)
  const expires = new Date(Date.now() + PASSWORD_RESET_TTL_MS)

  await prisma.passwordResetToken.create({
    data: { userId, tokenHash, expires, ipAddress: ipAddress ?? null },
  })

  return { rawToken, expires }
}
