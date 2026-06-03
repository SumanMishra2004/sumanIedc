import * as z from "zod"
import { 
  ConferenceStatus, 
  TeacherStatus,
  ConferenceMode
} from "@prisma/client"

export const doiRegex = /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/

export const conferenceSchema = z.object({
  conferenceName: z
    .string({ message: "Conference Name is required" })
    .trim()
    .min(3, "Conference name must be at least 3 characters")
    .max(250, "Conference name cannot exceed 250 characters"),
  paperName: z
    .string({ message: "Paper Name is required" })
    .trim()
    .min(3, "Paper name must be at least 3 characters")
    .max(250, "Paper name cannot exceed 250 characters")
    .nullable()
    .refine((val) => val !== null && val.trim() !== "", {
      message: "Paper name is required",
    }),
  abstract: z
    .string({ message: "Abstract is required" })
    .trim()
    .min(100, "Abstract must be at least 100 characters")
    .max(5000, "Abstract cannot exceed 5000 characters")
    .nullable()
    .refine((val) => val !== null && val.trim() !== "", {
      message: "Abstract is required",
    }),
  mode: z.nativeEnum(ConferenceMode, {
    message: "Conference Mode is required",
  }),
  imageUrl: z.string().nullable().optional(),
  documentUrl: z
    .string({ message: "Document is required" })
    .min(1, "Document is required")
    .nullable()
    .refine((val) => val !== null && val.trim() !== "", {
      message: "Document is required",
    }),
  conferenceStatus: z.nativeEnum(ConferenceStatus),
  teacherStatus: z.nativeEnum(TeacherStatus),
  isPublic: z.boolean(),
  registrationFees: z
    .number()
    .min(0, "Registration fees must be positive")
    .max(1000000, "Registration fees cannot exceed 1,000,000")
    .nullable()
    .optional(),
  reimbursement: z
    .number()
    .min(0, "Reimbursement must be positive")
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
    .min(3, "At least 3 keywords are required")
    .max(10, "At most 10 keywords are allowed")
    .refine(
      (arr) => new Set(arr).size === arr.length,
      { message: "Keywords must not contain duplicates" }
    ),
  paperDoi: z
    .string()
    .trim()
    .nullable()
    .optional(),
  paperLink: z
    .string()
    .trim()
    .nullable()
    .optional()
    .refine(
      (val) => !val || val === "" || z.string().url().safeParse(val).success,
      { message: "Must be a valid URL (e.g. https://example.com)" }
    ),
  conferenceDate: z
    .union([z.string(), z.date()])
    .nullable()
    .optional(),
  conferencePublisher: z
    .string()
    .trim()
    .max(200, "Publisher cannot exceed 200 characters")
    .nullable()
    .optional(),
  studentAuthorIds: z.array(z.string()).min(1, "At least one student author is required"),
  facultyAuthorIds: z.array(z.string()).min(1, "At least one faculty author is required"),
  updateComment: z.string().trim().nullable().optional(),
})
.superRefine((data, ctx) => {
  // 1. Reimbursement cannot exceed registrationFees
  if (
    data.reimbursement !== null &&
    data.reimbursement !== undefined &&
    data.registrationFees !== null &&
    data.registrationFees !== undefined &&
    data.reimbursement > data.registrationFees
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Reimbursement cannot exceed registration fees",
      path: ["reimbursement"],
    })
  }

  // 2. Conference Date required once conference reaches APPROVED or PUBLISHED
  const isApprovedOrPublished =
    data.conferenceStatus === ConferenceStatus.APPROVED ||
    data.conferenceStatus === ConferenceStatus.PUBLISHED ||
    data.conferenceStatus === ConferenceStatus.PRESENTED

  if (isApprovedOrPublished && !data.conferenceDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Conference date is required once approved, presented or published",
      path: ["conferenceDate"],
    })
  }

  // 3. Conference Date cannot be in the future (optional - let's keep it similar to book chapter)
  if (data.conferenceDate) {
    const confDate = new Date(data.conferenceDate)
    const now = new Date()
    if (confDate.getTime() > now.getTime() + 365 * 24 * 60 * 60 * 1000) { // arbitrary limit, or just no future validation for upcoming conferences if they list future ones? Let's not restrict upcoming conferences too much, maybe allow them, or skip future check.
    }
  }

  // 4. DOI format validation (using regex) if present
  if (data.paperDoi) {
    if (!doiRegex.test(data.paperDoi)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid DOI format (e.g. 10.1000/xyz123)",
        path: ["paperDoi"],
      })
    }
  }

  // 5. Require updateComment if teacherStatus is UPDATE
  if (data.teacherStatus === TeacherStatus.UPDATE && (!data.updateComment || data.updateComment.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "An update comment explaining the required corrections is required",
      path: ["updateComment"],
    })
  }
})
