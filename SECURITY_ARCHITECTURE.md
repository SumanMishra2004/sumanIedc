# Security Architecture Reference

Institutional Academic Research Management Platform  
Stack: Next.js 15 · Prisma · PostgreSQL · NextAuth JWT

---

## 1. Authorization Layers

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1 — Authentication                               │
│  NextAuth JWT (15-min session, argon2id passwords)      │
│  Role stored in JWT, re-derived from DB on role change  │
├─────────────────────────────────────────────────────────┤
│  Layer 2 — Role-Based Authorization                     │
│  src/lib/auth/permissions.ts                            │
│  src/lib/auth/guard.ts  (requireAuth / requireRole)     │
│  src/middleware.ts  (edge route protection)             │
├─────────────────────────────────────────────────────────┤
│  Layer 3 — Resource-Level Authorization                 │
│  Ownership checked via Prisma relations (never email)   │
│  canAccessResearchRecord / isStudentAuthor / isFaculty  │
│  Author                                                 │
├─────────────────────────────────────────────────────────┤
│  Layer 4 — Workflow State Authorization                 │
│  src/lib/auth/workflow.ts  (transition engine)          │
│  Every status change validated server-side              │
├─────────────────────────────────────────────────────────┤
│  Layer 5 — Field-Level Authorization                    │
│  src/lib/auth/field-allowlists.ts                       │
│  pickAllowedFields() — no mass assignment ever          │
└─────────────────────────────────────────────────────────┘
```

**Security contract:** Frontend restrictions are UX hints only.  
Every protected API route independently verifies auth, role, ownership, state, and fields.

---

## 2. Role Hierarchy

| Role | Rank | Primary Responsibility |
|------|------|------------------------|
| STUDENT | 0 | Submit and own research, achievements, grant participation |
| FACULTY | 1 | Create research, act as PI/CoPI, manage team grants |
| EDITOR | 2 | Editorial review, content publication, event management |
| ADMIN | 3 | Institutional administration, grant approval, user management |
| SUPERADMIN | 4 | System-level authority, emergency overrides, audit access |

> A higher rank does **not** automatically inherit all lower-rank permissions.  
> Permissions are explicitly defined — see the matrix below.

---

## 3. Role × Resource × Action Permission Matrix

Legend: ✅ allowed · ❌ denied · ⚠️ allowed with ownership check · 🔒 own record only

### 3.1 Research (Journal · BookChapter · Conference · Patent · Copyright)

| Action | STUDENT | FACULTY | EDITOR | ADMIN | SUPERADMIN |
|--------|---------|---------|--------|-------|------------|
| Submit (create) | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own record | ✅ | ✅ | ✅ | ✅ | ✅ |
| View any record | ❌ | ❌ | ✅ | ✅ | ✅ |
| Edit own record (allowed fields) | ⚠️ | ⚠️ | ✅ | ✅ | ✅ |
| Edit when locked (post-review) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Add student co-authors | ⚠️ | ⚠️ | ✅ | ✅ | ✅ |
| Add registered faculty co-authors | ⚠️ | ⚠️ | ✅ | ✅ | ✅ |
| Add unlisted faculty + verification | ✅ | ✅ | ✅ | ✅ | ✅ |
| Move to UNDER_REVIEW | ❌ | ❌ | ✅ | ✅ | ✅ |
| Request revision (UPDATE) | ❌ | ⚠️ own | ✅ | ✅ | ✅ |
| Approve (APPROVED) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Reject | ❌ | ❌ | ✅ | ✅ | ✅ |
| Publish (isPublic=true, terminal) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Set teacherStatus | ❌ | ⚠️ own | ✅ | ✅ | ✅ |
| Delete | ❌ | ⚠️ own | ✅ | ✅ | ✅ |
| Revert published (emergency) | ❌ | ❌ | ❌ | ❌ | ✅ |

### 3.2 Achievement

| Action | STUDENT | FACULTY | EDITOR | ADMIN | SUPERADMIN |
|--------|---------|---------|--------|-------|------------|
| Submit own | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own | ✅ | ✅ | ✅ | ✅ | ✅ |
| View all | ❌ | ❌ | ✅ | ✅ | ✅ |
| Edit own (allowed fields) | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| Edit after APPROVED | ❌ | ❌ | ✅ | ✅ | ✅ |
| Move to UNDER_REVIEW | ❌ | ❌ | ✅ | ✅ | ✅ |
| Approve (→ isPublic=true) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Reject | ❌ | ❌ | ✅ | ✅ | ✅ |
| Request changes | ❌ | ❌ | ✅ | ✅ | ✅ |
| Delete own (not APPROVED) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete any | ❌ | ❌ | ❌ | ✅ | ✅ |

### 3.3 Event

| Action | STUDENT | FACULTY | EDITOR | ADMIN | SUPERADMIN |
|--------|---------|---------|--------|-------|------------|
| View PUBLISHED events | ✅ | ✅ | ✅ | ✅ | ✅ |
| View DRAFT/CANCELLED/ARCHIVED | ❌ | ❌ | ✅ | ✅ | ✅ |
| Create (→ DRAFT) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Edit fields | ❌ | ❌ | ✅ | ✅ | ✅ |
| Publish (DRAFT → PUBLISHED) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Cancel (PUBLISHED → CANCELLED) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Archive | ❌ | ❌ | ✅ | ✅ | ✅ |
| Pull back to DRAFT | ❌ | ❌ | ❌ | ✅ | ✅ |
| Re-publish CANCELLED | ❌ | ❌ | ❌ | ✅ | ✅ |
| Unarchive | ❌ | ❌ | ❌ | ❌ | ✅ |
| Hard delete | ❌ | ❌ | ❌ | ✅ | ✅ |

### 3.4 Grant-In

| Action | STUDENT | FACULTY | EDITOR | ADMIN | SUPERADMIN |
|--------|---------|---------|--------|-------|------------|
| Create grant | ❌ | ✅ | ❌ | ✅ | ✅ |
| View own/participating grant | ✅ | ✅ | ❌ | ✅ | ✅ |
| View all grants | ❌ | ❌ | ❌ | ✅ | ✅ |
| Edit team metadata (PI/CoPI only) | ❌ | ⚠️ PI/CoPI | ❌ | ✅ | ✅ |
| Add team members | ❌ | ⚠️ PI/CoPI | ❌ | ✅ | ✅ |
| Approve (APPLIED → GRANTED) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Reject (APPLIED → REJECTED) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Complete (GRANTED → COMPLETED) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Set amountGranted / grantDate | ❌ | ❌ | ❌ | ✅ | ✅ |
| Set usedAmount directly | ❌ | ❌ | ❌ | ✅ | ✅ |
| Reopen COMPLETED (emergency) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Delete | ❌ | ⚠️ PI/CoPI | ❌ | ✅ | ✅ |

### 3.5 Grant Bills

| Action | STUDENT | FACULTY | EDITOR | ADMIN | SUPERADMIN |
|--------|---------|---------|--------|-------|------------|
| Submit bill (if grant member) | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own bills | ✅ | ✅ | ✅ | ✅ | ✅ |
| View all grant bills | ❌ | ⚠️ PI/CoPI | ❌ | ✅ | ✅ |
| Accept (PENDING → ACCEPTED) | ❌ | ⚠️ PI/CoPI | ❌ | ✅ | ✅ |
| Reject (PENDING → REJECTED) | ❌ | ⚠️ PI/CoPI | ❌ | ✅ | ✅ |
| Pay (ACCEPTED → PAID) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Delete own PENDING bill | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete ACCEPTED bill | ❌ | ⚠️ PI/CoPI | ❌ | ✅ | ✅ |
| Delete PAID bill | ❌ | ❌ | ❌ | ✅ | ✅ |
| Reverse PAID → ACCEPTED | ❌ | ❌ | ❌ | ❌ | ✅ |

### 3.6 Grant-Publication Mapping

| Action | STUDENT | FACULTY | EDITOR | ADMIN | SUPERADMIN |
|--------|---------|---------|--------|-------|------------|
| View mappings (if member) | ✅ | ✅ | ❌ | ✅ | ✅ |
| Create mapping | ❌ | ⚠️ PI/CoPI + author on pub | ❌ | ✅ | ✅ |
| Delete mapping | ❌ | ⚠️ PI/CoPI | ❌ | ✅ | ✅ |

### 3.7 Faculty Verification

| Action | STUDENT | FACULTY | EDITOR | ADMIN | SUPERADMIN |
|--------|---------|---------|--------|-------|------------|
| Create request | ✅ | ❌ | ❌ | ❌ | ❌ |
| View own requests | ✅ | ✅ (by email) | ❌ | ✅ | ✅ |
| View all requests | ❌ | ❌ | ❌ | ✅ | ✅ |
| Accept via token link | n/a | ✅ (named only) | ❌ | ✅ | ✅ |
| Accept via authenticated session | ❌ | ✅ (email match) | ❌ | ✅ | ✅ |
| Reject | ❌ | ✅ (email match) | ❌ | ✅ | ✅ |
| Admin override (with reason) | ❌ | ❌ | ❌ | ✅ | ✅ |

### 3.8 User Management

| Action | STUDENT | FACULTY | EDITOR | ADMIN | SUPERADMIN |
|--------|---------|---------|--------|-------|------------|
| View/edit own profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| View any user | ❌ | ❌ | ❌ | ✅ | ✅ |
| Edit another user's profile | ❌ | ❌ | ❌ | ✅ | ✅ |
| Assign STUDENT role | ❌ | ❌ | ❌ | ✅ | ✅ |
| Assign FACULTY role | ❌ | ❌ | ❌ | ✅ | ✅ |
| Assign EDITOR role | ❌ | ❌ | ❌ | ✅ | ✅ |
| Assign ADMIN role | ❌ | ❌ | ❌ | ✅ | ✅ |
| Assign SUPERADMIN role | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage ADMIN account | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage SUPERADMIN account | ❌ | ❌ | ❌ | ❌ | ✅ |
| Delete any user | ❌ | ❌ | ❌ | ✅ (not SUPERADMIN) | ✅ |

### 3.9 Audit Logs

| Action | STUDENT | FACULTY | EDITOR | ADMIN | SUPERADMIN |
|--------|---------|---------|--------|-------|------------|
| Read audit logs | ❌ | ❌ | ❌ | ✅ | ✅ |
| Write audit logs (system only) | auto | auto | auto | auto | auto |
| Delete audit logs | ❌ | ❌ | ❌ | ❌ | ❌ (DB only) |

### 3.10 Analytics / Stats

| Endpoint | STUDENT | FACULTY | EDITOR | ADMIN | SUPERADMIN |
|----------|---------|---------|--------|-------|------------|
| /api/admin/journals/stats | ❌ | ❌ | ✅ | ✅ | ✅ |
| /api/public/* | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 4. State Transition Tables

### 4.1 Journal

```
SUBMITTED ──[EDITOR+]──► UNDER_REVIEW
           ──[EDITOR+]──► (reject implicitly → stays SUBMITTED with UPDATE comment)

UNDER_REVIEW ──[EDITOR+]──► APPROVED
             ──[EDITOR+]──► SUBMITTED        (send back for revision)

APPROVED ──[EDITOR+]──► PUBLISHED            (sets isPublic=true)
         ──[EDITOR+]──► UNDER_REVIEW         (re-open)

PUBLISHED ──[SUPERADMIN]──► APPROVED         (emergency revert only)
```

TeacherStatus side-channel (faculty review layer):
```
UPLOADED ──[FACULTY+]──► ACCEPTED   → implies journalStatus = UNDER_REVIEW
         ──[FACULTY+]──► UPDATE     → notifies author for revision
         ──[FACULTY+]──► REJECTED

UPDATE ──[STUDENT/FACULTY]──► UPLOADED  → author resubmits; journalStatus = SUBMITTED

ACCEPTED ──[EDITOR+]──► PUBLISHED   → implies journalStatus = PUBLISHED
         ──[EDITOR+]──► UPDATE
         ──[EDITOR+]──► REJECTED

REJECTED ──[SUPERADMIN]──► UPLOADED  (emergency override only)
```

### 4.2 Book Chapter

```
SUBMITTED → UNDER_REVIEW → APPROVED → PUBLISHED
            UNDER_REVIEW → SUBMITTED (revision)
PUBLISHED  → APPROVED [SUPERADMIN only]
```
TeacherStatus: same as Journal pattern above.

### 4.3 Conference

```
SUBMITTED → UNDER_REVIEW → APPROVED → PRESENTED → PUBLISHED
            UNDER_REVIEW → SUBMITTED (revision)
            APPROVED     → UNDER_REVIEW (re-open)
            PRESENTED    → APPROVED (rollback)
PUBLISHED  → PRESENTED [SUPERADMIN only]
```

### 4.4 Patent

```
SUBMITTED → UNDER_REVIEW → APPROVED → GRANTED (sets isPublic=true)
            UNDER_REVIEW → SUBMITTED (revision)
            APPROVED     → UNDER_REVIEW (re-open)
GRANTED   → APPROVED [SUPERADMIN only]
```

### 4.5 Copyright

```
SUBMITTED → UNDER_REVIEW → APPROVED → PUBLISHED
            UNDER_REVIEW → SUBMITTED (revision)
            APPROVED     → UNDER_REVIEW (re-open)
PUBLISHED  → APPROVED [SUPERADMIN only]
```

### 4.6 Grant-In

```
APPLIED ──[ADMIN+]──► GRANTED    (requires amountGranted + grantDate, sets usedAmount=0)
APPLIED ──[ADMIN+]──► REJECTED   (requires reason)

GRANTED ──[ADMIN+]──► COMPLETED
GRANTED ──[SUPERADMIN]──► APPLIED  (emergency re-open)

REJECTED ──[SUPERADMIN]──► APPLIED (allow re-application)

COMPLETED ──[SUPERADMIN]──► GRANTED (emergency re-open)
```

### 4.7 Grant Bill

```
PENDING ──[PI/CoPI or ADMIN+]──► ACCEPTED   (atomic: billStatus + usedAmount increment)
PENDING ──[PI/CoPI or ADMIN+]──► REJECTED   (file deleted from storage)

ACCEPTED ──[ADMIN+]──► PAID
ACCEPTED ──[ADMIN+]──► PENDING  (correction)

PAID ──[SUPERADMIN]──► ACCEPTED  (audit correction only)
```

Financial invariants enforced server-side:
- `amount >= 0`
- `usedAmount >= 0`
- `usedAmount <= amountGranted` (checked before ACCEPT; rejected if it would exceed cap)
- ACCEPT is a Prisma `$transaction` — partial failure impossible

### 4.8 Achievement

```
SUBMITTED ──[EDITOR+]──► UNDER_REVIEW
UNDER_REVIEW ──[EDITOR+]──► APPROVED   (sets isPublic=true)
             ──[EDITOR+]──► REJECTED   (clears isPublic)
             ──[EDITOR+]──► SUBMITTED  (send back with updateComment)
APPROVED ──[ADMIN+]──► UNDER_REVIEW
         ──[ADMIN+]──► REJECTED
REJECTED ──[STUDENT/FACULTY]──► SUBMITTED  (owner resubmits)
         ──[ADMIN+]──► UNDER_REVIEW
```

### 4.9 Event

```
DRAFT ──[EDITOR+]──► PUBLISHED
PUBLISHED ──[EDITOR+]──► CANCELLED
          ──[EDITOR+]──► ARCHIVED
          ──[ADMIN+] ──► DRAFT       (pull back)
CANCELLED ──[EDITOR+]──► ARCHIVED
          ──[ADMIN+] ──► PUBLISHED   (re-activate)
ARCHIVED ──[SUPERADMIN]──► PUBLISHED  (unarchive)
```

### 4.10 Faculty Verification

```
PENDING ──[faculty via token link]──► ACCEPTED  (sets tokenUsed=true, verifiedAt)
        ──[faculty via token link]──► REJECTED  (stores rejectionReason)
        ──[faculty via session]   ──► ACCEPTED
        ──[faculty via session]   ──► REJECTED
        ──[ADMIN+ override]       ──► ACCEPTED  (requires overrideReason, always audited)
        ──[ADMIN+ override]       ──► REJECTED  (requires overrideReason, always audited)

ACCEPTED ──[ADMIN+ override]──► REJECTED  (override only)
REJECTED ──[ADMIN+ override]──► ACCEPTED  (override only)
```

Token security invariants:
- `crypto.randomBytes(48).toString('hex')` — 96-char hex, 384 bits entropy
- Expires after 72 hours (`tokenExpiry`)
- Single-use (`tokenUsed = true` on first consumption)
- Idempotency guard: PATCH returns 409 if `status !== PENDING`
- Replay guard: PATCH returns 409 if `tokenUsed === true`
- Token field **never** returned in any authenticated API response

---

## 5. HTTP Status Code Contract

| Condition | Status |
|-----------|--------|
| Not authenticated (no session) | **401** Unauthorized |
| Authenticated but insufficient role | **403** Forbidden |
| Resource doesn't exist | **404** Not Found |
| Resource exists but caller has no access (to hide existence) | **404** Not Found |
| Resource exists and caller has access but is explicitly forbidden | **403** Forbidden |
| Invalid state transition | **400** Bad Request |
| Duplicate (mapping, author, token already used) | **409** Conflict |
| Token expired or already used | **410** Gone |
| Validation error (missing fields) | **400** Bad Request |

---

## 6. Mass Assignment Protection

All API routes use `pickAllowedFields(body, allowlist)` before any `prisma.update()`.

System-protected fields that are **never** in any client-facing allowlist:

```
id · createdAt · updatedAt · userId · role · password
isPublic · teacherStatus · journalStatus · bookChapterStatus
conferenceStatus · patentStatus · copyrightStatus · achievementStatus
grantInStatus · eventStatus · billStatus · certificateStatus · fdpStatus
overrideBy · overrideAt · overrideReason
verificationToken · tokenExpiry · tokenUsed · status (FacultyVerification)
amountGranted · usedAmount · hideFromAdmin
profileCompleted · emailVerified
```

Per-role allowlists are defined in `src/lib/auth/field-allowlists.ts`.

---

## 7. IDOR Protection

All resource-level access checks use `userId` from the **server session** — never from request body, query params, or URL parameters beyond the resource ID itself.

```typescript
// ❌ What we never do
const userId = req.body.userId

// ✅ What we always do
const session = await auth()
const userId = session.user.id   // from server-side JWT only
```

Ownership check pattern for research:
```typescript
const record = await prisma.journal.findUnique({
  where: { id },
  include: { studentAuthors: true, facultyAuthors: true },
})
const hasAccess = canAccessResearchRecord(
  session.user.id,     // from session — never client
  session.user.role,   // from session — never client
  record.studentAuthors,
  record.facultyAuthors,
)
if (!hasAccess) return NextResponse.json({ error: 'Not found' }, { status: 404 })
```

---

## 8. Public API Security

Public APIs **hard-lock** visibility at the database query level:

```typescript
// Public journal — client CANNOT override these via query params
where.isPublic      = true
where.journalStatus = 'PUBLISHED'

// Public events — client CANNOT override
where.eventStatus = EventStatus.PUBLISHED

// Public achievements — client CANNOT override
where.achievementStatus = 'APPROVED'
where.isPublic          = true
```

No post-fetch filtering — visibility is enforced in the `WHERE` clause.

---

## 9. Audit Log Coverage

Every action below is recorded in `AuditLog` with `actorId`, `actorRole`, `ipAddress`, `oldValue`, `newValue`, and `reason` (where applicable):

| Event | Awaited (blocking) |
|-------|--------------------|
| User role changed | ✅ yes |
| User deleted | fire-and-forget |
| Research status changed | fire-and-forget |
| Research published | fire-and-forget |
| Grant approved / rejected / completed | ✅ yes |
| Bill accepted / rejected / paid | ✅ yes |
| Achievement approved / rejected | fire-and-forget |
| Event published / cancelled / archived | fire-and-forget |
| Faculty verification accepted / rejected | ✅ yes |
| Admin override (any) | ✅ yes |
| SUPERADMIN override | ✅ yes |
| Grant mapping created / deleted | fire-and-forget |

Security-sensitive events (role changes, financial transactions, admin overrides) are always **awaited** so a failure is surfaced to the caller rather than silently swallowed.

---

## 10. Database Transactions

Operations that modify multiple related records use `prisma.$transaction()`:

| Operation | Transaction covers |
|-----------|-------------------|
| Bill ACCEPT | billStatus update + usedAmount increment |
| Bill DELETE (ACCEPTED) | bill deletion + usedAmount decrement |
| Faculty verification ACCEPT (session path) | request update + teacher-author junction |
| Faculty verification REJECT (session path) | request update + teacher-author junction |
| Faculty verification ACCEPT (token path) | request update + teacher-author junction |
| Admin override accept/reject | request update + teacher-author junction |
| Grant mapping creation | mapping insert (isolated) |

---

## 11. Key Files Reference

```
src/
├── lib/
│   ├── auth/
│   │   ├── permissions.ts       — role predicates and permission matrix
│   │   ├── guard.ts             — requireAuth / requireRole / ownership helpers
│   │   ├── workflow.ts          — state-transition engine for all resource types
│   │   └── field-allowlists.ts  — per-role field allowlists
│   ├── audit.ts                 — append-only audit log service
│   └── notifications.ts         — centralized notification service
├── middleware.ts                 — Next.js edge route protection
└── __tests__/
    └── authorization.test.ts    — 93 security assertions (35 scenarios)

prisma/
└── schema.prisma
    ├── AuditLog model            — append-only audit trail
    ├── EventStatus enum          — DRAFT / PUBLISHED / CANCELLED / ARCHIVED
    └── AuditAction enum          — action constants

API routes hardened:
├── /api/research/journal/[id]
├── /api/research/book-chapter/[id]
├── /api/research/conference/[id]
├── /api/research/patent/[id]
├── /api/research/copyright/[id]
├── /api/research/achievement/[id]
├── /api/research/grant-in/[id]
├── /api/research/grant-in/[id]/bills/[billId]
├── /api/research/grant-in/[id]/mapping
├── /api/research/grant-in/[id]/mapping/[mappingId]
├── /api/admin/achievements/[id]
├── /api/admin/events          (POST → DRAFT by default)
├── /api/admin/events/[id]     (full lifecycle with transition engine)
├── /api/admin/users/[id]      (role change with audit log)
├── /api/admin/journals/stats  (EDITOR+ guard)
├── /api/faculty-verification/[id]/accept
├── /api/faculty-verification/[id]/reject
├── /api/faculty-verification/[id]/admin-override
├── /api/faculty-verification/verify
├── /api/public/journal        (hard-locked isPublic + PUBLISHED)
├── /api/public/book-chapter   (hard-locked)
└── /api/public/events         (hard-locked EventStatus.PUBLISHED)
```
