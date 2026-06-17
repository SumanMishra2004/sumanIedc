import * as z from "zod"
import { CERTIFICATE_STATUSES } from "@/types/certificate"

export const certificateSchema = z.object({
  title: z
    .string({ message: "Title is required" })
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title cannot exceed 200 characters"),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .nullable()
    .optional(),
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
  documentUrl: z
    .string({ message: "Certificate document is required" })
    .min(1, "Certificate document is required")
    .nullable()
    .optional(),
  offeredBy: z
    .string({ message: "Issuer (Offered By) is required" })
    .trim()
    .min(2, "Issuer name must be at least 2 characters")
    .max(200, "Issuer name cannot exceed 200 characters"),
  dateOfCompletion: z
    .union([z.string(), z.date()])
    .refine((val) => val !== null && val !== undefined, {
      message: "Completion date is required",
    }),
  remark: z
    .string()
    .trim()
    .max(500, "Remark cannot exceed 500 characters")
    .nullable()
    .optional(),
  isPublic: z.boolean().default(true),
  certificateStatus: z.enum(CERTIFICATE_STATUSES).default("SUBMITTED"),
  updateComment: z.string().trim().nullable().optional(),
})
.superRefine((data, ctx) => {
  // Completion date cannot be in the future
  if (data.dateOfCompletion) {
    const compDate = new Date(data.dateOfCompletion)
    const now = new Date()
    if (compDate.getTime() > now.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Completion date cannot be in the future",
        path: ["dateOfCompletion"],
      })
    }
  }
})
