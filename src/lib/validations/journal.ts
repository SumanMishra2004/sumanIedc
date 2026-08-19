import * as z from "zod"
import { 
  JournalScope, 
  JournalReviewType, 
  JournalAccessType, 
  JournalIndexing, 
  JournalQuartile, 
  JournalPublicationMode,
  JournalStatus,
  TeacherStatus
} from "@prisma/client"
import { externalAuthorSchema } from "@/lib/validations/book-chapter"

export { externalAuthorSchema }
export const doiRegex = /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/

export const journalSchema = z.object({
  serialNo: z
    .string({ message: "Serial number is required" })
    .trim()
    .min(3, "Serial number must be at least 3 characters")
    .max(50, "Serial number cannot exceed 50 characters"),
  title: z
    .string({ message: "Paper title is required" })
    .trim()
    .min(10, "Title must be at least 10 characters")
    .max(300, "Title cannot exceed 300 characters"),
  journalName: z
    .string({ message: "Journal name is required" })
    .trim()
    .min(3, "Journal name must be at least 3 characters")
    .max(200, "Journal name cannot exceed 200 characters"),
  abstract: z
    .string({ message: "Abstract is required" })
    .trim()
    .min(100, "Abstract must be at least 100 characters")
    .max(5000, "Abstract cannot exceed 5000 characters")
    .nullable()
    .refine((val) => val !== null && val.trim() !== "", {
      message: "Abstract is required",
    }),
  scope: z.nativeEnum(JournalScope, {
    message: "Scope is required",
  }),
  reviewType: z.nativeEnum(JournalReviewType, {
    message: "Review type is required",
  }),
  accessType: z.nativeEnum(JournalAccessType, {
    message: "Access type is required",
  }),
  indexing: z.nativeEnum(JournalIndexing, {
    message: "Indexing is required",
  }),
  quartile: z.nativeEnum(JournalQuartile, {
    message: "Quartile is required",
  }),
  impactFactor: z
    .number()
    .min(0, "Impact factor must be positive")
    .max(100, "Impact factor cannot exceed 100")
    .nullable()
    .optional()
    .refine(
      (val) => val === null || val === undefined || Number(val.toFixed(2)) === val,
      { message: "Impact factor must have at most 2 decimal places" }
    ),
  impactFactorDate: z
    .union([z.string(), z.date()])
    .nullable()
    .optional(),
  publisher: z
    .string()
    .trim()
    .min(2, "Publisher must be at least 2 characters")
    .max(200, "Publisher cannot exceed 200 characters")
    .nullable()
    .optional()
    .refine((val) => val === null || val === undefined || val.trim() !== "", {
      message: "Publisher cannot be empty string",
    }),
  publicationMode: z.nativeEnum(JournalPublicationMode, {
    message: "Publication mode is required",
  }),
  publicationDate: z
    .union([z.string(), z.date()])
    .nullable()
    .optional(),
  doi: z
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
  imageUrl: z.string().nullable().optional(),
  documentUrl: z
    .string({ message: "Document URL is required" })
    .min(1, "Document is required")
    .nullable()
    .refine((val) => val !== null && val.trim() !== "", {
      message: "Document is required",
    }),
  journalStatus: z.nativeEnum(JournalStatus),
  teacherStatus: z.nativeEnum(TeacherStatus),
  isPublic: z.boolean(),
  studentAuthorIds: z.array(z.string()).default([]),
  facultyAuthorIds: z.array(z.string()).min(1, "At least one faculty author must be selected from the platform"),
  /** External (unlisted) faculty co-authors */
  externalFacultyAuthors: z.array(externalAuthorSchema).default([]),
  /** External (unlisted) student co-authors */
  externalStudentAuthors: z.array(externalAuthorSchema).default([]),
  updateComment: z.string().trim().nullable().optional(),
})
.superRefine((data, ctx) => {
  // 1. Quartile auto-set check (If indexing is NONE, quartile must be NOT_APPLICABLE)
  if (data.indexing === JournalIndexing.NONE && data.quartile !== JournalQuartile.NOT_APPLICABLE) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Quartile must be NOT_APPLICABLE if indexing is NONE",
      path: ["quartile"],
    })
  }

  // 2. Reimbursement cannot exceed registrationFees
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

  // 3. Publication Date required once journal reaches APPROVED or PUBLISHED
  const isApprovedOrPublished =
    data.journalStatus === JournalStatus.APPROVED ||
    data.journalStatus === JournalStatus.PUBLISHED

  if (isApprovedOrPublished && !data.publicationDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Publication date is required once the journal is approved/published",
      path: ["publicationDate"],
    })
  }

  // 4. Publication Date cannot be in the future
  if (data.publicationDate) {
    const pubDate = new Date(data.publicationDate)
    const now = new Date()
    // Normalize times to ignore minor clock skew
    if (pubDate.getTime() > now.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Publication date cannot be in the future",
        path: ["publicationDate"],
      })
    }
  }

  // 5. DOI required before publication (once approved/published or teacherStatus is PUBLISHED)
  const isDoiRequired = isApprovedOrPublished || data.teacherStatus === TeacherStatus.PUBLISHED
  if (isDoiRequired && !data.doi) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "DOI is required before publication",
      path: ["doi"],
    })
  }

  // 6. DOI format validation (using regex)
  if (data.doi) {
    if (!doiRegex.test(data.doi)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid DOI format (e.g. 10.1000/xyz123)",
        path: ["doi"],
      })
    }
  }

  // 7. Require updateComment if teacherStatus is UPDATE
  if (data.teacherStatus === TeacherStatus.UPDATE && (!data.updateComment || data.updateComment.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "An update comment explaining the required corrections is required",
      path: ["updateComment"],
    })
  }

  // 8. At least one student author (platform OR external)
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

  // 9. No duplicate external faculty emails
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

  // 10. No duplicate external student emails
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
