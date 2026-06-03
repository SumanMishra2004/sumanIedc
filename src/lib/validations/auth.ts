import { z } from 'zod'

// ── Sign-in ──────────────────────────────────────────────────────────────────
export const SignInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
})

export type SignInInput = z.infer<typeof SignInSchema>

// ── Sign-up ──────────────────────────────────────────────────────────────────
export const SignUpSchema = z
  .object({
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
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    turnstileToken: z.string().min(1, 'CAPTCHA verification is required'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type SignUpInput = z.infer<typeof SignUpSchema>

// ── Profile Setup ─────────────────────────────────────────────────────────────
export const SetupProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name is too long')
    .trim(),
  bio: z.string().max(500, 'Bio too long').optional(),
  department: z.string().max(100, 'Department name too long').optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,15}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  image: z.string().url('Invalid image URL').optional().or(z.literal('')),
  coverImage: z.string().url('Invalid image URL').optional().or(z.literal('')),
  institution: z.string().max(100, 'Institution name too long').optional(),
  linkedinLink: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  skills: z.string().optional(),

  // Student specific
  enrollmentNo: z.string().max(50, 'Enrollment number too long').optional(),
  degree: z.string().max(100, 'Degree too long').optional(),
  currentYear: z.string().max(20, 'Year too long').optional(),
  currentSemester: z.string().max(20, 'Semester too long').optional(),
  graduationYear: z.string().max(4, 'Invalid year').optional(),
  resumeLink: z.string().url('Invalid URL').optional().or(z.literal('')),
  portfolioLink: z.string().url('Invalid URL').optional().or(z.literal('')),
  githubLink: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  researchInterests: z.string().optional(),

  // Faculty specific
  designation: z.string().max(100, 'Designation too long').optional(),
  yearsOfExperience: z.string().max(50, 'Years too long').optional(),
  areasOfExpertise: z.string().optional(),
  orcidId: z.string().max(50, 'ORCID too long').optional(),
})

export type SetupProfileInput = z.infer<typeof SetupProfileSchema>

// ── Forgot Password ──────────────────────────────────────────────────────────
export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  turnstileToken: z.string().min(1, 'CAPTCHA verification is required'),
})

// ── Reset Password ───────────────────────────────────────────────────────────
export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password is too long')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    token: z.string().min(1, 'Token is missing'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
