import * as z from "zod"
import { 
  CopyrightStatus, 
  TeacherStatus
} from "@prisma/client"

export const copyrightSchema = z.object({
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
  copyrightStatus: z.nativeEnum(CopyrightStatus, {
    message: "Status is required",
  }),
  teacherStatus: z.nativeEnum(TeacherStatus).optional(),
  regNo: z
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
  dateOfFiling: z
    .union([z.string(), z.date()])
    .nullable()
    .optional(),
  dateOfSubmission: z
    .union([z.string(), z.date()])
    .nullable()
    .optional(),
  dateOfPublished: z
    .union([z.string(), z.date()])
    .nullable()
    .optional(),
  dateOfGrant: z
    .union([z.string(), z.date()])
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

  // 2. Dates cannot be in the future
  const datesToCheck = [
    { val: data.dateOfFiling, name: "Filing date", path: "dateOfFiling" },
    { val: data.dateOfSubmission, name: "Submission date", path: "dateOfSubmission" },
    { val: data.dateOfPublished, name: "Published date", path: "dateOfPublished" },
    { val: data.dateOfGrant, name: "Grant date", path: "dateOfGrant" },
  ]
  datesToCheck.forEach(({ val, name, path }) => {
    if (val) {
      const d = new Date(val)
      const now = new Date()
      if (d.getTime() > now.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${name} cannot be in the future`,
          path: [path],
        })
      }
    }
  })
})
