import { z } from "zod";
import {
  JournalScope,
  JournalReviewType,
  JournalAccessType,
  JournalIndexing,
  JournalQuartile,
  JournalPublicationMode,
  ConferenceMode,
  ConferenceStatus,
  PatentStatus,
  GrantInStatus,
  GrantInRole,
  BillType,
  TeacherStatus,
} from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Common Validation Schemas
// ─────────────────────────────────────────────────────────────

export const idSchema = z.object({
  id: z.string().cuid(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─────────────────────────────────────────────────────────────
// Journal Validation Schemas
// ─────────────────────────────────────────────────────────────

export const createJournalSchema = z.object({
  title: z.string().min(1).max(500),
  journalName: z.string().min(1).max(300),
  abstract: z.string().optional(),
  scope: z.nativeEnum(JournalScope),
  reviewType: z.nativeEnum(JournalReviewType),
  accessType: z.nativeEnum(JournalAccessType),
  indexing: z.nativeEnum(JournalIndexing),
  quartile: z.nativeEnum(JournalQuartile).default("NOT_APPLICABLE"),
  impactFactor: z.number().min(0).optional(),
  impactFactorDate: z.string().datetime().optional(),
  publisher: z.string().optional(),
  publicationMode: z.nativeEnum(JournalPublicationMode),
  publicationDate: z.string().datetime().optional(),
  doi: z.string().optional(),
  paperLink: z.string().url().optional(),
  keywords: z.array(z.string()).default([]),
  registrationFees: z.number().min(0).optional(),
  reimbursement: z.number().min(0).optional(),
  imageUrl: z.string().url().optional(),
  documentUrl: z.string().url().optional(),
  studentAuthorIds: z.array(z.string().cuid()).default([]),
  facultyAuthorIds: z.array(z.string().cuid()).default([]),
  unlistedFacultyAuthors: z
    .array(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        institution: z.string().optional(),
        department: z.string().optional(),
        designation: z.string().optional(),
        orcidId: z.string().optional(),
      })
    )
    .default([]),
});

export const updateJournalSchema = createJournalSchema.partial();

// ─────────────────────────────────────────────────────────────
// Book Chapter Validation Schemas
// ─────────────────────────────────────────────────────────────

export const createBookChapterSchema = z.object({
  title: z.string().min(1).max(500),
  abstract: z.string().optional(),
  isbnIssn: z.string().optional(),
  publisher: z.string().optional(),
  publicationDate: z.string().datetime().optional(),
  doi: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  registrationFees: z.number().min(0).optional(),
  reimbursement: z.number().min(0).optional(),
  imageUrl: z.string().url().optional(),
  documentUrl: z.string().url().optional(),
  studentAuthorIds: z.array(z.string().cuid()).default([]),
  facultyAuthorIds: z.array(z.string().cuid()).default([]),
  unlistedFacultyAuthors: z
    .array(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        institution: z.string().optional(),
        department: z.string().optional(),
        designation: z.string().optional(),
        orcidId: z.string().optional(),
      })
    )
    .default([]),
});

export const updateBookChapterSchema = createBookChapterSchema.partial();

// ─────────────────────────────────────────────────────────────
// Conference Validation Schemas
// ─────────────────────────────────────────────────────────────

export const createConferenceSchema = z.object({
  conferenceName: z.string().min(1).max(500),
  mode: z.nativeEnum(ConferenceMode).default("OFFLINE"),
  abstract: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  conferencePublisher: z.string().optional(),
  conferenceDate: z.string().datetime().optional(),
  paperDoi: z.string().optional(),
  paperLink: z.string().url().optional(),
  paperName: z.string().optional(),
  registrationFees: z.number().min(0).optional(),
  reimbursement: z.number().min(0).optional(),
  imageUrl: z.string().url().optional(),
  documentUrl: z.string().url().optional(),
  studentAuthorIds: z.array(z.string().cuid()).default([]),
  facultyAuthorIds: z.array(z.string().cuid()).default([]),
  unlistedFacultyAuthors: z
    .array(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        institution: z.string().optional(),
        department: z.string().optional(),
        designation: z.string().optional(),
        orcidId: z.string().optional(),
      })
    )
    .default([]),
});

export const updateConferenceSchema = createConferenceSchema.partial();

// ─────────────────────────────────────────────────────────────
// Patent Validation Schemas
// ─────────────────────────────────────────────────────────────

export const createPatentSchema = z.object({
  title: z.string().min(1).max(500),
  keywords: z.array(z.string()).default([]),
  abstract: z.string().optional(),
  applicationNo: z.string().optional(),
  grantedPatentNo: z.string().optional(),
  filingDate: z.string().datetime().optional(),
  submissionDate: z.string().datetime().optional(),
  publicationDate: z.string().datetime().optional(),
  grantDate: z.string().datetime().optional(),
  patentLink: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  documentUrl: z.string().url().optional(),
  studentAuthorIds: z.array(z.string().cuid()).default([]),
  facultyAuthorIds: z.array(z.string().cuid()).default([]),
  unlistedFacultyAuthors: z
    .array(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        institution: z.string().optional(),
        department: z.string().optional(),
        designation: z.string().optional(),
        orcidId: z.string().optional(),
      })
    )
    .default([]),
});

export const updatePatentSchema = createPatentSchema.partial();

// ─────────────────────────────────────────────────────────────
// Copyright Validation Schemas
// ─────────────────────────────────────────────────────────────

export const createCopyrightSchema = z.object({
  regNo: z.string().min(1).max(100),
  title: z.string().min(1).max(500),
  abstract: z.string().optional(),
  dateOfFiling: z.string().datetime().optional(),
  dateOfSubmission: z.string().datetime().optional(),
  dateOfPublished: z.string().datetime().optional(),
  dateOfGrant: z.string().datetime().optional(),
  registrationFees: z.number().min(0).optional(),
  reimbursement: z.number().min(0).optional(),
  imageUrl: z.string().url().optional(),
  documentUrl: z.string().url().optional(),
  studentAuthorIds: z.array(z.string().cuid()).default([]),
  facultyAuthorIds: z.array(z.string().cuid()).default([]),
  unlistedFacultyAuthors: z
    .array(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        institution: z.string().optional(),
        department: z.string().optional(),
        designation: z.string().optional(),
        orcidId: z.string().optional(),
      })
    )
    .default([]),
});

export const updateCopyrightSchema = createCopyrightSchema.partial();

// ─────────────────────────────────────────────────────────────
// Grant Validation Schemas
// ─────────────────────────────────────────────────────────────

export const createGrantInSchema = z.object({
  projectCode: z.string().optional(),
  applicationDate: z.string().datetime().optional(),
  grantDate: z.string().datetime().optional(),
  durationOfProject: z.string().optional(),
  amountGranted: z.number().min(0).optional(),
  studentAuthorIds: z.array(z.string().cuid()).default([]),
  facultyAuthors: z
    .array(
      z.object({
        userId: z.string().cuid().optional(),
        role: z.nativeEnum(GrantInRole),
        unlistedFaculty: z
          .object({
            name: z.string().min(1),
            email: z.string().email(),
            institution: z.string().optional(),
            department: z.string().optional(),
            designation: z.string().optional(),
            orcidId: z.string().optional(),
          })
          .optional(),
      })
    )
    .default([]),
});

export const updateGrantInSchema = createGrantInSchema.partial();

// ─────────────────────────────────────────────────────────────
// Certificate Validation Schemas
// ─────────────────────────────────────────────────────────────

export const createCertificateSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  documentUrl: z.string().url().optional(),
  offeredBy: z.string().optional(),
  dateOfCompletion: z.string().datetime(),
  remark: z.string().optional(),
});

export const updateCertificateSchema = createCertificateSchema.partial();

// ─────────────────────────────────────────────────────────────
// FDP Validation Schemas
// ─────────────────────────────────────────────────────────────

export const createFDPSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  organizedBy: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  topic: z.string().optional(),
  duration: z.string().optional(),
  remark: z.string().optional(),
});

export const updateFDPSchema = createFDPSchema.partial();

// ─────────────────────────────────────────────────────────────
// Achievement Validation Schemas
// ─────────────────────────────────────────────────────────────

export const createAchievementSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1),
  category: z.string().optional(),
  year: z.number().int().min(1900).max(2100),
  imageUrl: z.string().url().optional(),
  documentUrl: z.string().url().optional(),
});

export const updateAchievementSchema = createAchievementSchema.partial();

// ─────────────────────────────────────────────────────────────
// Status Update Schemas
// ─────────────────────────────────────────────────────────────

export const updateTeacherStatusSchema = z.object({
  teacherStatus: z.nativeEnum(TeacherStatus),
  updateComment: z.string().optional(),
});

export const updateResearchStatusSchema = z.object({
  status: z.string(), // Will be validated against specific enum per resource
  updateComment: z.string().optional(),
});

export const updatePublicVisibilitySchema = z.object({
  isPublic: z.boolean(),
});
