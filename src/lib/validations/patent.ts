import * as z from "zod"
import { PatentStatus, TeacherStatus } from "@prisma/client"

export const patentSchema = z.object({
  title: z
    .string({ message: "Title is required" })
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(300, "Title cannot exceed 300 characters"),
  abstract: z
    .string()
    .trim()
    .min(50, "Abstract must be at least 50 characters")
    .max(5000, "Abstract cannot exceed 5000 characters")
    .nullable()
    .optional(),
  imageUrl: z
    .string()
    .nullable()
    .optional(),
  documentUrl: z
    .string({ message: "Document is required" })
    .min(1, "Document is required")
    .nullable()
    .optional(),
  patentStatus: z.nativeEnum(PatentStatus).default(PatentStatus.SUBMITTED),
  teacherStatus: z.nativeEnum(TeacherStatus).default(TeacherStatus.UPLOADED),
  grantedPatentNo: z
    .string()
    .trim()
    .nullable()
    .optional(),
  applicationNo: z
    .string()
    .trim()
    .nullable()
    .optional(),
  patentLink: z
    .string()
    .trim()
    .nullable()
    .optional(),
  isPublic: z.boolean().default(false),
  keywords: z
    .array(
      z
        .string()
        .trim()
        .min(2, "Each keyword must be at least 2 characters")
        .max(50, "Each keyword cannot exceed 50 characters")
    )
    .min(1, "At least 1 keyword is required")
    .max(10, "At most 10 keywords are allowed")
    .optional()
    .default([]),
  filingDate: z
    .union([z.string(), z.date()])
    .nullable()
    .optional(),
  submissionDate: z
    .union([z.string(), z.date()])
    .nullable()
    .optional(),
  publicationDate: z
    .union([z.string(), z.date()])
    .nullable()
    .optional(),
  grantDate: z
    .union([z.string(), z.date()])
    .nullable()
    .optional(),
  studentAuthorIds: z.array(z.string()).default([]),
  facultyAuthorIds: z.array(z.string()).min(1, "At least one faculty author is required"),
  updateComment: z.string().trim().nullable().optional(),
})
.superRefine((data, ctx) => {
  // 1. If patentStatus === GRANTED, then grantedPatentNo and grantDate are required
  if (data.patentStatus === PatentStatus.GRANTED) {
    if (!data.grantedPatentNo || data.grantedPatentNo.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Patent number is required when status is GRANTED",
        path: ["grantedPatentNo"],
      })
    }
    if (!data.grantDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Grant date is required when status is GRANTED",
        path: ["grantDate"],
      })
    }
  }

  // 2. Dates cannot be in the future
  const now = new Date()
  const checkDateNotFuture = (dateVal: string | Date | null | undefined, path: string) => {
    if (dateVal) {
      const d = new Date(dateVal)
      if (d.getTime() > now.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Date cannot be in the future",
          path: [path],
        })
      }
    }
  }
  checkDateNotFuture(data.filingDate, "filingDate")
  checkDateNotFuture(data.submissionDate, "submissionDate")
  checkDateNotFuture(data.publicationDate, "publicationDate")
  checkDateNotFuture(data.grantDate, "grantDate")

  // 3. Grant date cannot be before filing date
  if (data.grantDate && data.filingDate) {
    const gd = new Date(data.grantDate)
    const fd = new Date(data.filingDate)
    if (gd.getTime() < fd.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Grant date cannot be before filing date",
        path: ["grantDate"],
      })
    }
  }
})
