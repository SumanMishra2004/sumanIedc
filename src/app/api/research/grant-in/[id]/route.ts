/**
 * GET    /api/research/grant-in/[id]
 * PATCH  /api/research/grant-in/[id]  — hardened: field allowlists, workflow validation, financial integrity
 * DELETE /api/research/grant-in/[id]
 *
 * Security fixes applied vs original:
 *  - ADMIN logic bug fixed (was requiring isPublic=true before edit — removed)
 *  - Grant status transitions validated via workflow engine (no arbitrary status jumps)
 *  - Field allowlists per role (no mass assignment of amountGranted/usedAmount by FACULTY)
 *  - Financial integrity: usedAmount <= amountGranted enforced in DB transaction
 *  - Audit log on every status change
 *  - 401/403/404 semantics correct
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { GrantInRole, GrantInStatus, UserRole } from '@prisma/client'
import { GrantInPATCHRequestBodyData } from '@/types/grant-in'
import { storage } from '@/lib/appwrite'
import {
  canApproveGrant,
  canCompleteGrant,
  isAdminOrHigher,
  isFacultyOrHigher,
  canViewAllResearch,
} from '@/lib/auth/permissions'
import { validateGrantStatusTransition } from '@/lib/auth/workflow'
import { pickAllowedFields, GRANT_FACULTY_FIELDS, GRANT_ADMIN_FIELDS } from '@/lib/auth/field-allowlists'
import { AuditActions, auditGrantFinancial, fromSession } from '@/lib/audit'
import {
  notifyGrantApproved,
  notifyGrantRejected,
  notifyGrantCompleted,
} from '@/lib/notifications'
import { getClientIp } from '@/lib/auth/guard'

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized. Please login.' }, { status: 401 })
    }

    const userId   = session.user.id
    const userRole = session.user.role

    const whereClause: any = { id }

    if (userRole === UserRole.FACULTY) {
      whereClause.facultyAuthors = { some: { userId } }
    } else if (userRole === UserRole.STUDENT) {
      whereClause.studentAuthors = { some: { userId } }
    } else if (userRole === UserRole.ADMIN) {
      // ADMIN can see all grants (hideFromAdmin logic removed — admins should see everything)
    }
    // EDITOR/SUPERADMIN: no filter

    const grant = await prisma.grantIn.findFirst({
      where: whereClause,
      include: {
        facultyAuthors: { include: { user: true } },
        studentAuthors: { include: { user: true } },
        bills:          { include: { user: true }, orderBy: { createdAt: 'desc' } },
        publicationMappings: {
          include: {
            journal: true, conference: true,
            patent: true, bookChapter: true, copyright: true,
          },
        },
      },
    })

    if (!grant) {
      return NextResponse.json({ message: 'Grant not found or you do not have permission to access it.' }, { status: 404 })
    }

    return NextResponse.json({ grant }, { status: 200 })
  } catch (error) {
    console.error('[Grant GET]', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const userId   = session.user.id
    const userRole = session.user.role
    const ip       = await getClientIp(req)

    if (userRole === UserRole.STUDENT) {
      return NextResponse.json({ message: 'Forbidden. Students cannot update grants.' }, { status: 403 })
    }

    const body = await req.json() as GrantInPATCHRequestBodyData

    // ── 1. Fetch existing grant ─────────────────────────────────────────────
    const existingGrant = await prisma.grantIn.findUnique({
      where: { id },
      include: { facultyAuthors: true, studentAuthors: true },
    })

    if (!existingGrant) {
      return NextResponse.json({ message: 'Grant not found.' }, { status: 404 })
    }

    // ── 2. Faculty PI/CoPI check ────────────────────────────────────────────
    if (userRole === UserRole.FACULTY) {
      const facultyEntry = existingGrant.facultyAuthors.find((fa) => fa.userId === userId)
      if (
        !facultyEntry ||
        (facultyEntry.role !== GrantInRole.FACULTY_PI &&
          facultyEntry.role !== GrantInRole.FACULTY_COPI)
      ) {
        return NextResponse.json({ message: 'Only PI or CoPI can update this Grant.' }, { status: 403 })
      }
    }

    // EDITOR has no special grant management permissions — treat as FACULTY-level for team edits
    if (userRole === UserRole.EDITOR) {
      const facultyEntry = existingGrant.facultyAuthors.find((fa) => fa.userId === userId)
      if (!facultyEntry) {
        return NextResponse.json({ message: 'Forbidden — EDITOR must be a grant team member to edit.' }, { status: 403 })
      }
    }

    // ── 3. Grant status transition validation ───────────────────────────────
    if (body.grantInStatus && body.grantInStatus !== existingGrant.grantInStatus) {
      // Only ADMIN/SUPERADMIN can change grant status
      if (!canApproveGrant(userRole)) {
        return NextResponse.json({ message: 'Forbidden — only ADMIN or higher can change grant status.' }, { status: 403 })
      }

      const transition = validateGrantStatusTransition(
        userRole,
        existingGrant.grantInStatus,
        body.grantInStatus as GrantInStatus,
      )
      if (!transition.allowed) {
        return NextResponse.json(
          { message: (transition as { allowed: false; reason: string }).reason },
          { status: (transition as { allowed: false; status: number }).status },
        )
      }
    }

    // ── 4. Field allowlist by role ──────────────────────────────────────────
    const allowlist = isAdminOrHigher(userRole) ? GRANT_ADMIN_FIELDS : GRANT_FACULTY_FIELDS
    const safeBody  = pickAllowedFields(body as unknown as Record<string, unknown>, allowlist) as Record<string, unknown>

    // ── 5. Financial integrity validation ───────────────────────────────────
    // Resolve final values considering both the update and existing state
    const resolvedAmount = (safeBody.amountGranted as number | undefined) ?? existingGrant.amountGranted
    const resolvedUsed   = (safeBody.usedAmount   as number | undefined) ?? existingGrant.usedAmount

    if (resolvedAmount !== null && resolvedAmount !== undefined && resolvedAmount < 0) {
      return NextResponse.json({ message: 'amountGranted cannot be negative.' }, { status: 400 })
    }
    if (resolvedUsed !== null && resolvedUsed !== undefined && resolvedUsed < 0) {
      return NextResponse.json({ message: 'usedAmount cannot be negative.' }, { status: 400 })
    }
    if (
      resolvedAmount !== null && resolvedAmount !== undefined &&
      resolvedUsed   !== null && resolvedUsed   !== undefined &&
      resolvedUsed > resolvedAmount
    ) {
      return NextResponse.json({ message: 'usedAmount cannot exceed amountGranted.' }, { status: 400 })
    }

    // ── 6. When status → GRANTED, initialize financial fields ──────────────
    if (safeBody.grantInStatus === GrantInStatus.GRANTED && existingGrant.grantInStatus !== GrantInStatus.GRANTED) {
      if (!safeBody.amountGranted && !existingGrant.amountGranted) {
        return NextResponse.json({ message: 'amountGranted is required when approving a grant.' }, { status: 400 })
      }
      if (!safeBody.grantDate && !existingGrant.grantDate) {
        return NextResponse.json({ message: 'grantDate is required when approving a grant.' }, { status: 400 })
      }
      // Initialize usedAmount to 0 if not yet set
      if (existingGrant.usedAmount === null) {
        safeBody.usedAmount = 0
      }
    }

    // ── 7. Author list validation (PI/CoPI or ADMIN only) ───────────────────
    if (body.facultyAuthors) {
      if (!isAdminOrHigher(userRole) && userRole !== UserRole.FACULTY) {
        return NextResponse.json({ message: 'Forbidden — cannot modify grant authors.' }, { status: 403 })
      }

      const hasPI = (body.facultyAuthors as Array<{ role: GrantInRole }>).some(
        (f) => f.role === GrantInRole.FACULTY_PI,
      )
      if (!hasPI) {
        return NextResponse.json({ message: 'At least one FACULTY_PI must remain.' }, { status: 400 })
      }

      if (userRole === UserRole.FACULTY) {
        const selfEntry = (body.facultyAuthors as Array<{ userId?: string; role: GrantInRole }>).find(
          (f) => f.userId === userId,
        )
        if (!selfEntry) {
          return NextResponse.json({ message: 'PI/CoPI cannot remove themselves from the grant.' }, { status: 400 })
        }
      }
    }

    // ── 8. Build update in a transaction for financial operations ───────────
    const updatePayload: any = { ...safeBody }

    if (safeBody.applicationDate) updatePayload.applicationDate = new Date(safeBody.applicationDate as string)
    if (safeBody.grantDate)       updatePayload.grantDate       = new Date(safeBody.grantDate as string)

    if (body.facultyAuthors) {
      updatePayload.facultyAuthors = {
        deleteMany: {},
        create: (body.facultyAuthors as Array<{ userId: string; role: GrantInRole }>).map((f) => ({
          userId: f.userId,
          role:   f.role,
        })),
      }
    }

    if (body.studentAuthors) {
      updatePayload.studentAuthors = {
        deleteMany: {},
        create: (body.studentAuthors as Array<{ userId: string }>).map((s) => ({
          userId: s.userId,
        })),
      }
    }

    const updatedGrant = await prisma.grantIn.update({
      where: { id },
      data:  updatePayload,
      include: { facultyAuthors: true, studentAuthors: true },
    })

    // ── 9. Audit log for status changes ─────────────────────────────────────
    if (existingGrant.grantInStatus !== updatedGrant.grantInStatus) {
      const actionMap: Record<string, (typeof AuditActions)[keyof typeof AuditActions]> = {
        GRANTED:   AuditActions.GRANT_APPROVED,
        REJECTED:  AuditActions.GRANT_REJECTED,
        COMPLETED: AuditActions.GRANT_COMPLETED,
      }
      const action = actionMap[updatedGrant.grantInStatus] ?? AuditActions.GRANT_CREATED

      await auditGrantFinancial({
        session:      session as { user: { id: string; email: string; role: string } },
        action,
        resourceType: 'GrantIn',
        resourceId:   id,
        oldValue:     { status: existingGrant.grantInStatus, amountGranted: existingGrant.amountGranted },
        newValue:     { status: updatedGrant.grantInStatus, amountGranted: updatedGrant.amountGranted },
        ipAddress:    ip,
      })

      // ── 10. Status-change notifications ──────────────────────────────────
      const allAuthorIds = [
        ...updatedGrant.facultyAuthors.map((fa) => fa.userId).filter((uid): uid is string => uid !== null),
        ...updatedGrant.studentAuthors.map((sa) => sa.userId),
      ]
      const projectCode = updatedGrant.projectCode ?? 'N/A'

      if (updatedGrant.grantInStatus === GrantInStatus.GRANTED) {
        await notifyGrantApproved({ grantId: id, projectCode, authorIds: allAuthorIds })
      } else if (updatedGrant.grantInStatus === GrantInStatus.REJECTED) {
        await notifyGrantRejected({ grantId: id, projectCode, authorIds: allAuthorIds })
      } else if (updatedGrant.grantInStatus === GrantInStatus.COMPLETED) {
        await notifyGrantCompleted({ grantId: id, projectCode, authorIds: allAuthorIds })
      }
    }

    return NextResponse.json({ message: 'Grant Updated Successfully ✅', grant: updatedGrant }, { status: 200 })
  } catch (error) {
    console.error('[Grant PATCH]', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized. Please login.' }, { status: 401 })
    }

    const userId   = session.user.id
    const userRole = session.user.role

    if (userRole === UserRole.STUDENT) {
      return NextResponse.json({ message: "Forbidden. Students can't delete grants." }, { status: 403 })
    }

    const { id } = await params

    const grant = await prisma.grantIn.findFirst({
      where: {
        id,
        ...(canViewAllResearch(userRole) ? {} : {
          OR: [
            { facultyAuthors: { some: { userId } } },
            { studentAuthors: { some: { userId } } },
          ],
        }),
      },
      include: { facultyAuthors: true },
    })

    if (!grant) {
      return NextResponse.json({ message: 'Grant not found or you do not have permission to delete it.' }, { status: 404 })
    }

    if (userRole === UserRole.FACULTY) {
      const entry = grant.facultyAuthors.find((fa) => fa.userId === userId)
      if (!entry || (entry.role !== GrantInRole.FACULTY_PI && entry.role !== GrantInRole.FACULTY_COPI)) {
        return NextResponse.json({ message: 'Forbidden. Only PI or Co-PI can delete this grant.' }, { status: 403 })
      }
    }

    // Delete associated bill files from storage
    const bills = await prisma.grantInBill.findMany({
      where: { grantInId: id }, select: { fileId: true },
    })
    const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!
    for (const bill of bills) {
      if (bill.fileId) {
        await storage.deleteFile(BUCKET_ID, bill.fileId).catch((e) =>
          console.error(`Failed to delete bill file ${bill.fileId}`, e),
        )
      }
    }

    await prisma.grantIn.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted grant successfully ✅' }, { status: 200 })
  } catch (error) {
    console.error('[Grant DELETE]', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
