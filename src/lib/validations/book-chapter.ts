import * as z from "zod"
import { 
  BookchapterStatus, 
  TeacherStatus
} from "@prisma/client"

export const doiRegex = /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/

/** A faculty/student author who is not on the platform */
export const externalAuthorSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(150, "Name cannot exceed 150 characters"),
  email: z
    .string({ message: "Email is required" })
    .trim()
    .email("Must be a valid email address")
    .max(255, "Email cannot exceed 255 characters"),
  affiliation: z.string().trim().max(255).nullable().optional(),
  department: z.string().trim().max(150).nullable().optional(),
})

export type ExternalAuthor = z.infer<typeof externalAuthorSchema>

export const bookChapterSchema = z.object({
  title: z
    .string({ message: "Title is required" })
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(300, "Title cannot exceed 300 characters"),
  abstract: z
    .string({ message: "Abstract is required" })
    .trim()
    .min(100, "Abstract must be at least 100 characters")
    .max(5000, "Abstract cannot exceed 5000 characters")
    .nullable()
    .refine((val) => val !== null && val.trim() !== "", {
      message: "Abstract is required",
    }),
  imageUrl: z
    .string({ message: "Cover image is required" })
    .min(1, "Cover image is required"),
  documentUrl: z
    .string({ message: "Document is required" })
    .min(1, "Document is required")
    .nullable()
    .refine((val) => val !== null && val.trim() !== "", {
      message: "Document is required",
    }),
  bookChapterStatus: z.nativeEnum(BookchapterStatus, {
    message: "Status is required",
  }),
  isbnIssn: z
    .string()
    .trim()
    .nullable()
    .optional(),
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
  isPublic: z.boolean(),
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
  doi: z
    .string()
    .trim()
    .nullable()
    .optional(),
  publicationDate: z
    .union([z.string(), z.date()])
    .nullable()
    .optional(),
  publisher: z
    .string({ message: "Publisher is required" })
    .trim()
    .min(2, "Publisher must be at least 2 characters")
    .max(200, "Publisher cannot exceed 200 characters")
    .nullable()
    .refine((val) => val !== null && val.trim() !== "", {
      message: "Publisher is required",
    }),
  studentAuthorIds: z.array(z.string()).default([]),
  facultyAuthorIds: z.array(z.string()).min(1, "At least one faculty author must be selected from the platform"),
  /** External (unlisted) faculty co-authors */
  externalFacultyAuthors: z.array(externalAuthorSchema).default([]),
  /** External (unlisted) student co-authors */
  externalStudentAuthors: z.array(externalAuthorSchema).default([]),
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

  // 2. Publication Date required once book chapter reaches APPROVED or PUBLISHED
  const isApprovedOrPublished =
    data.bookChapterStatus === BookchapterStatus.APPROVED ||
    data.bookChapterStatus === BookchapterStatus.PUBLISHED

  if (isApprovedOrPublished && !data.publicationDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Publication date is required once approved or published",
      path: ["publicationDate"],
    })
  }

  // 3. Publication Date cannot be in the future
  if (data.publicationDate) {
    const pubDate = new Date(data.publicationDate)
    const now = new Date()
    if (pubDate.getTime() > now.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Publication date cannot be in the future",
        path: ["publicationDate"],
      })
    }
  }

  // 4. DOI required before publication (once approved/published)
  if (isApprovedOrPublished && !data.doi) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "DOI is required once approved or published",
      path: ["doi"],
    })
  }

  // 5. DOI format validation (using regex)
  if (data.doi) {
    if (!doiRegex.test(data.doi)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid DOI format (e.g. 10.1000/xyz123)",
        path: ["doi"],
      })
    }
  }

  // 6. At least one student author (platform OR external)
  const hasStudentAuthor =
    (data.studentAuthorIds && data.studentAuthorIds.length > 0) ||
    (data.externalStudentAuthors && data.externalStudentAuthors.length > 0)
  if (!hasStudentAuthor) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one student author is required",
      path: ["studentAuthorIds"],
    })
  }

  // 7. No duplicate external faculty emails
  if (data.externalFacultyAuthors && data.externalFacultyAuthors.length > 0) {
    const emails = data.externalFacultyAuthors.map((a) => a.email.toLowerCase())
    if (new Set(emails).size !== emails.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "External faculty author emails must be unique",
        path: ["externalFacultyAuthors"],
      })
    }
  }

  // 8. No duplicate external student emails
  if (data.externalStudentAuthors && data.externalStudentAuthors.length > 0) {
    const emails = data.externalStudentAuthors.map((a) => a.email.toLowerCase())
    if (new Set(emails).size !== emails.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "External student author emails must be unique",
        path: ["externalStudentAuthors"],
      })
    }
  }
})
