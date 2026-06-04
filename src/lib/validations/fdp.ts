import * as z from "zod"
import { FDPStatus } from "@prisma/client"

export const fdpSchema = z.object({
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
  organizedBy: z
    .string({ message: "Organizer is required" })
    .trim()
    .min(2, "Organizer name must be at least 2 characters")
    .max(200, "Organizer name cannot exceed 200 characters")
    .nullable()
    .optional(),
  startDate: z
    .union([z.string(), z.date()])
    .refine((val) => val !== null && val !== undefined && val !== "", {
      message: "Start date is required",
    }),
  endDate: z
    .union([z.string(), z.date()])
    .refine((val) => val !== null && val !== undefined && val !== "", {
      message: "End date is required",
    }),
  topic: z
    .string()
    .trim()
    .max(200, "Topic cannot exceed 200 characters")
    .nullable()
    .optional(),
  duration: z
    .string()
    .trim()
    .max(100, "Duration cannot exceed 100 characters")
    .nullable()
    .optional(),
  remark: z
    .string()
    .trim()
    .max(500, "Remark cannot exceed 500 characters")
    .nullable()
    .optional(),
  isPublic: z.boolean().default(false),
  fdpStatus: z.nativeEnum(FDPStatus).default(FDPStatus.SUBMITTED),
  updateComment: z.string().trim().nullable().optional(),
})
.superRefine((data, ctx) => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    if (end.getTime() < start.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be on or after start date",
        path: ["endDate"],
      })
    }
  }
})
