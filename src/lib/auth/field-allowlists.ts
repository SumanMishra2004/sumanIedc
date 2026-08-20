/**
 * @file field-allowlists.ts
 * @description Per-role, per-resource field update allowlists.
 *
 * SECURITY CONTRACT:
 *  - NEVER pass request.body directly to prisma.update({ data: body }).
 *  - ALWAYS use pickAllowedFields() to extract only the fields the current
 *    role is permitted to update.
 *  - Fields not in the allowlist are silently dropped — they are never
 *    passed through to the database.
 *  - Protected system fields (role, userId, ownership relations, status,
 *    workflow state, financial totals, audit fields) are NEVER in any
 *    user-facing allowlist.
 *
 * Usage:
 *   const allowed = pickAllowedFields(body, journalAuthorFields)
 *   await prisma.journal.update({ where: { id }, data: allowed })
 */

// ─── Generic picker ───────────────────────────────────────────────────────────

/**
 * Returns a new object containing only the keys present in `allowedKeys`.
 * Any keys not in `allowedKeys` are silently discarded.
 */
export function pickAllowedFields<T extends Record<string, unknown>>(
  source: T,
  allowedKeys: readonly string[],
): Partial<T> {
  const result: Partial<T> = {}
  for (const key of allowedKeys) {
    if (key in source) {
      ;(result as Record<string, unknown>)[key] = source[key]
    }
  }
  return result
}

// ─── System-protected fields (NEVER allowed via client) ───────────────────────
// These must never appear in any allowlist below.
export const SYSTEM_PROTECTED_FIELDS = [
  'id',
  'createdAt',
  'updatedAt',
  'userId',
  'role',
  'isPublic',
  'teacherStatus',
  'journalStatus',
  'bookChapterStatus',
  'conferenceStatus',
  'patentStatus',
  'copyrightStatus',
  'achievementStatus',
  'grantInStatus',
  'eventStatus',
  'billStatus',
  'certificateStatus',
  'fdpStatus',
  'overrideBy',
  'overrideAt',
  'overrideReason',
  'verificationToken',
  'tokenExpiry',
  'tokenUsed',
  'status', // FacultyVerificationRequest.status
  'amountGranted',
  'usedAmount',
  'hideFromAdmin',
  'profileCompleted',
  'emailVerified',
  'password',
] as const

// ─── Journal ──────────────────────────────────────────────────────────────────

/** Fields a STUDENT author may update on their own SUBMITTED/UPDATE-requested journal */
export const JOURNAL_STUDENT_FIELDS = [
  'title',
  'journalName',
  'abstract',
  'scope',
  'reviewType',
  'accessType',
  'indexing',
  'quartile',
  'publicationMode',
  'publisher',
  'keywords',
  'imageUrl',
  'documentUrl',
  'doi',
  'paperLink',
  'publicationDate',
  'impactFactor',
  'impactFactorDate',
  'registrationFees',
  'reimbursement',
  'serialNo',
] as const

/** Fields a FACULTY author may update (review layer — TeacherStatus changes handled separately) */
export const JOURNAL_FACULTY_FIELDS = [
  ...JOURNAL_STUDENT_FIELDS,
  'updateComment', // faculty can leave a revision note
] as const

/** Fields an EDITOR may update (editorial + publication layer) */
export const JOURNAL_EDITOR_FIELDS = [
  ...JOURNAL_FACULTY_FIELDS,
  'teacherStatus',
  'journalStatus',
  'isPublic',
  'updateComment',
] as const

/** Fields an ADMIN/SUPERADMIN may update */
export const JOURNAL_ADMIN_FIELDS = [
  ...JOURNAL_EDITOR_FIELDS,
] as const

// ─── Book Chapter ─────────────────────────────────────────────────────────────

export const BOOK_CHAPTER_STUDENT_FIELDS = [
  'title',
  'abstract',
  'imageUrl',
  'documentUrl',
  'isbnIssn',
  'registrationFees',
  'reimbursement',
  'keywords',
  'doi',
  'publicationDate',
  'publisher',
] as const

export const BOOK_CHAPTER_FACULTY_FIELDS = [
  ...BOOK_CHAPTER_STUDENT_FIELDS,
  'updateComment',
] as const

export const BOOK_CHAPTER_EDITOR_FIELDS = [
  ...BOOK_CHAPTER_FACULTY_FIELDS,
  'teacherStatus',
  'bookChapterStatus',
  'isPublic',
] as const

export const BOOK_CHAPTER_ADMIN_FIELDS = [
  ...BOOK_CHAPTER_EDITOR_FIELDS,
] as const

// ─── Conference ───────────────────────────────────────────────────────────────

export const CONFERENCE_STUDENT_FIELDS = [
  'conferenceName',
  'mode',
  'abstract',
  'keywords',
  'imageUrl',
  'documentUrl',
  'registrationFees',
  'reimbursement',
  'conferencePublisher',
  'conferenceDate',
  'paperDoi',
  'paperLink',
  'paperName',
  'statusDate',
] as const

export const CONFERENCE_FACULTY_FIELDS = [
  ...CONFERENCE_STUDENT_FIELDS,
  'updateComment',
] as const

export const CONFERENCE_EDITOR_FIELDS = [
  ...CONFERENCE_FACULTY_FIELDS,
  'teacherStatus',
  'conferenceStatus',
  'isPublic',
] as const

export const CONFERENCE_ADMIN_FIELDS = [
  ...CONFERENCE_EDITOR_FIELDS,
] as const

// ─── Patent ───────────────────────────────────────────────────────────────────

export const PATENT_STUDENT_FIELDS = [
  'title',
  'keywords',
  'abstract',
  'imageUrl',
  'documentUrl',
  'filingDate',
  'submissionDate',
  'publicationDate',
  'grantDate',
  'applicationNo',
  'grantedPatentNo',
  'patentLink',
] as const

export const PATENT_FACULTY_FIELDS = [
  ...PATENT_STUDENT_FIELDS,
  'updateComment',
] as const

export const PATENT_EDITOR_FIELDS = [
  ...PATENT_FACULTY_FIELDS,
  'teacherStatus',
  'patentStatus',
  'isPublic',
] as const

export const PATENT_ADMIN_FIELDS = [
  ...PATENT_EDITOR_FIELDS,
] as const

// ─── Copyright ────────────────────────────────────────────────────────────────

export const COPYRIGHT_STUDENT_FIELDS = [
  'regNo',
  'title',
  'abstract',
  'imageUrl',
  'documentUrl',
  'dateOfFiling',
  'dateOfSubmission',
  'dateOfPublished',
  'dateOfGrant',
  'registrationFees',
  'reimbursement',
] as const

export const COPYRIGHT_FACULTY_FIELDS = [
  ...COPYRIGHT_STUDENT_FIELDS,
  'updateComment',
] as const

export const COPYRIGHT_EDITOR_FIELDS = [
  ...COPYRIGHT_FACULTY_FIELDS,
  'teacherStatus',
  'copyrightStatus',
  'isPublic',
] as const

export const COPYRIGHT_ADMIN_FIELDS = [
  ...COPYRIGHT_EDITOR_FIELDS,
] as const

// ─── Achievement ──────────────────────────────────────────────────────────────

/** What the owner (STUDENT or FACULTY) can modify before approval */
export const ACHIEVEMENT_OWNER_FIELDS = [
  'title',
  'description',
  'category',
  'year',
  'imageUrl',
  'documentUrl',
] as const

/** What EDITOR can additionally modify during review */
export const ACHIEVEMENT_EDITOR_FIELDS = [
  ...ACHIEVEMENT_OWNER_FIELDS,
  'achievementStatus',
  'isPublic',
  'updateComment',
] as const

export const ACHIEVEMENT_ADMIN_FIELDS = [
  ...ACHIEVEMENT_EDITOR_FIELDS,
] as const

// ─── Event ────────────────────────────────────────────────────────────────────

/** What EDITOR can modify on an event */
export const EVENT_EDITOR_FIELDS = [
  'name',
  'description',
  'posterUrl',
  'registrationCost',
  'registrationLink',
  'contactName',
  'contactPhone',
  'eventDate',
] as const

/** EDITOR can also change eventStatus (via transition validator) */
export const EVENT_EDITOR_STATUS_FIELDS = [
  ...EVENT_EDITOR_FIELDS,
  'eventStatus',
] as const

export const EVENT_ADMIN_FIELDS = [
  ...EVENT_EDITOR_STATUS_FIELDS,
] as const

// ─── Grant-In ─────────────────────────────────────────────────────────────────

/**
 * What a FACULTY PI/CoPI can update on their own grant.
 * Financial and status fields are excluded — ADMIN manages those.
 */
export const GRANT_FACULTY_FIELDS = [
  'projectCode',
  'durationOfProject',
  'applicationDate',
  'isPublic',
] as const

/**
 * What ADMIN can update (includes status and financial fields).
 * Financial fields validated separately for range integrity.
 */
export const GRANT_ADMIN_FIELDS = [
  ...GRANT_FACULTY_FIELDS,
  'grantInStatus',  // validated via workflow engine
  'grantDate',
  'amountGranted',  // validated: must be >= 0
  'usedAmount',     // validated: must be >= 0 and <= amountGranted
  'hideFromAdmin',
] as const

export const GRANT_SUPERADMIN_FIELDS = [
  ...GRANT_ADMIN_FIELDS,
] as const

// ─── Grant Bill ───────────────────────────────────────────────────────────────

/**
 * Fields a bill submitter (any participant) can set on submission.
 * billStatus, userId, grantInId, fileId are set by the server — never client.
 */
export const BILL_SUBMIT_FIELDS = [
  'billType',
  'customBillType',
  'amount',
  'billDate',
] as const

/**
 * Fields available when FACULTY PI/CoPI or ADMIN reviews a bill.
 */
export const BILL_REVIEW_FIELDS = [
  'billStatus', // validated via workflow engine
] as const

// ─── User profile ─────────────────────────────────────────────────────────────

/** Fields a user can update on their own profile */
export const USER_SELF_PROFILE_FIELDS = [
  'name',
  'bio',
  'department',
  'phone',
  'image',
  'coverImage',
  'institution',
  'linkedinLink',
  'skills',
  'enrollmentNo',
  'degree',
  'currentYear',
  'currentSemester',
  'graduationYear',
  'resumeLink',
  'portfolioLink',
  'githubLink',
  'researchInterests',
  'designation',
  'yearsOfExperience',
  'areasOfExpertise',
  'orcidId',
] as const

/** Fields an ADMIN can update on another user's profile */
export const USER_ADMIN_FIELDS = [
  'name',
  'department',
  'phone',
  'bio',
  'image',
  'profileCompleted',
] as const

// ─── Role-based field selector ────────────────────────────────────────────────

/**
 * Returns the correct field allowlist for a research resource based on
 * the caller's role. Callers must still verify resource ownership before
 * calling this.
 *
 * @param resourceType - 'journal' | 'book-chapter' | 'conference' | 'patent' | 'copyright'
 * @param role         - The caller's role string from the authenticated session
 */
export function getResearchUpdateAllowlist(
  resourceType: 'journal' | 'book-chapter' | 'conference' | 'patent' | 'copyright',
  role: string,
): readonly string[] {
  const map: Record<string, Record<string, readonly string[]>> = {
    journal: {
      STUDENT:    JOURNAL_STUDENT_FIELDS,
      FACULTY:    JOURNAL_FACULTY_FIELDS,
      EDITOR:     JOURNAL_EDITOR_FIELDS,
      ADMIN:      JOURNAL_ADMIN_FIELDS,
      SUPERADMIN: JOURNAL_ADMIN_FIELDS,
    },
    'book-chapter': {
      STUDENT:    BOOK_CHAPTER_STUDENT_FIELDS,
      FACULTY:    BOOK_CHAPTER_FACULTY_FIELDS,
      EDITOR:     BOOK_CHAPTER_EDITOR_FIELDS,
      ADMIN:      BOOK_CHAPTER_ADMIN_FIELDS,
      SUPERADMIN: BOOK_CHAPTER_ADMIN_FIELDS,
    },
    conference: {
      STUDENT:    CONFERENCE_STUDENT_FIELDS,
      FACULTY:    CONFERENCE_FACULTY_FIELDS,
      EDITOR:     CONFERENCE_EDITOR_FIELDS,
      ADMIN:      CONFERENCE_ADMIN_FIELDS,
      SUPERADMIN: CONFERENCE_ADMIN_FIELDS,
    },
    patent: {
      STUDENT:    PATENT_STUDENT_FIELDS,
      FACULTY:    PATENT_FACULTY_FIELDS,
      EDITOR:     PATENT_EDITOR_FIELDS,
      ADMIN:      PATENT_ADMIN_FIELDS,
      SUPERADMIN: PATENT_ADMIN_FIELDS,
    },
    copyright: {
      STUDENT:    COPYRIGHT_STUDENT_FIELDS,
      FACULTY:    COPYRIGHT_FACULTY_FIELDS,
      EDITOR:     COPYRIGHT_EDITOR_FIELDS,
      ADMIN:      COPYRIGHT_ADMIN_FIELDS,
      SUPERADMIN: COPYRIGHT_ADMIN_FIELDS,
    },
  }

  return map[resourceType]?.[role] ?? []
}
