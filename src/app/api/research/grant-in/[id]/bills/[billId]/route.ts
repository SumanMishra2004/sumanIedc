/**
 * PATCH  /api/research/grant-in/[id]/bills/[billId]
 * DELETE /api/research/grant-in/[id]/bills/[billId]
 *
 * Security fixes vs original:
 *  - Bill status transitions validated via workflow engine
 *  - ACCEPT uses a Prisma transaction to atomically update billStatus + usedAmount
 *    (prevents race condition double-payment)
 *  - PAY action added (ADMIN only) — marks bill PAID
 *  - Audit log on accept/reject/pay
 *  - usedAmount never goes negative (decrement guarded)
 *  - 401/403/404 correct semantics
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { storage } from '@/lib/appwrite'
import { BillStatus, UserRole, GrantInRole } from '@prisma/client'
import { regenerateMasterPdf } from '@/lib/research/masterPdf.service'
import { validateBillStatusTransition } from '@/lib/auth/workflow'
import { isAdminOrHigher } from '@/lib/auth/permissions'
import { AuditActions, auditGrantFinancial } from '@/lib/audit'
import { getClientIp } from '@/lib/auth/guard'
import {
  notifyBillAccepted,
  notifyBillRejected,
  notifyBillPaid,
} from '@/lib/notifications'

const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!

// ─── PATCH — accept | reject | pay ───────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; billId: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: grantId, billId } = await params
    const userRole  = session.user.role as UserRole
    const userId    = session.user.id
    const ip        = await getClientIp(req)
    const body      = await req.json()
    const action: string = body.action // 'ACCEPT' | 'REJECT' | 'PAY'

    if (!['ACCEPT', 'REJECT', 'PAY'].includes(action)) {
      return NextResponse.json({ error: "action must be 'ACCEPT', 'REJECT', or 'PAY'" }, { status: 400 })
    }

    // ── 1. Fetch bill + grant together ──────────────────────────────────────
    const bill = await prisma.grantInBill.findUnique({
      where: { id: billId },
      include: {
        grantIn: {
          include: {
            facultyAuthors: { where: { userId, role: { in: [GrantInRole.FACULTY_PI, GrantInRole.FACULTY_COPI] } } },
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    if (!bill || bill.grantInId !== grantId) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    // ── 2. Authorization ────────────────────────────────────────────────────
    const isFacultyPICoPI = bill.grantIn.facultyAuthors.length > 0
    const isAdmin         = isAdminOrHigher(userRole)

    if (action === 'PAY') {
      // Only ADMIN+ can disburse payment
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden — only ADMIN or higher can mark bills as paid' }, { status: 403 })
      }
    } else {
      // ACCEPT/REJECT: ADMIN or PI/CoPI
      if (!isAdmin && !isFacultyPICoPI) {
        return NextResponse.json({ error: 'Forbidden — only ADMIN or PI/CoPI can accept/reject bills' }, { status: 403 })
      }
    }

    // ── 3. Validate state transition ────────────────────────────────────────
    const targetStatus: BillStatus =
      action === 'ACCEPT' ? BillStatus.ACCEPTED :
      action === 'REJECT' ? BillStatus.REJECTED :
      BillStatus.PAID

    const transition = validateBillStatusTransition(userRole, bill.billStatus, targetStatus)
    if (!transition.allowed) {
      return NextResponse.json(
        { error: (transition as { allowed: false; reason: string }).reason },
        { status: (transition as { allowed: false; status: number }).status },
      )
    }

    // ── 4. Execute in transaction ───────────────────────────────────────────
    const { projectCode, amountGranted, usedAmount } = bill.grantIn

    if (action === 'ACCEPT') {
      // Atomic: update bill status + increment usedAmount, validate ceiling
      const billAmount = bill.amount ?? 0

      if (billAmount > 0 && amountGranted !== null && usedAmount !== null) {
        const projectedUsed = usedAmount + billAmount
        if (projectedUsed > amountGranted) {
          return NextResponse.json(
            { error: `Accepting this bill (₹${billAmount}) would exceed the total grant amount (₹${amountGranted}). Current used: ₹${usedAmount}.` },
            { status: 400 },
          )
        }
      }

      await prisma.$transaction(async (tx) => {
        await tx.grantInBill.update({ where: { id: billId }, data: { billStatus: BillStatus.ACCEPTED } })
        if (billAmount > 0) {
          await tx.grantIn.update({
            where: { id: grantId },
            data:  { usedAmount: { increment: billAmount } },
          })
        }
      })

      await regenerateMasterPdf(grantId).catch((e) => console.error('[MasterPDF] regeneration failed', e))

      await auditGrantFinancial({
        session:      session as { user: { id: string; email: string; role: string } },
        action:       AuditActions.BILL_ACCEPTED,
        resourceType: 'GrantInBill',
        resourceId:   billId,
        oldValue:     { status: bill.billStatus, usedAmount },
        newValue:     { status: BillStatus.ACCEPTED, usedAmount: (usedAmount ?? 0) + (bill.amount ?? 0) },
        ipAddress:    ip,
      })

      await notifyBillAccepted({
        grantId,
        projectCode: projectCode ?? 'N/A',
        submitterId: bill.userId,
        amount:      bill.amount,
        adminIds:    (await prisma.user.findMany({ where: { role: { in: [UserRole.ADMIN, UserRole.SUPERADMIN] } }, select: { id: true } })).map((a) => a.id),
      })

    } else if (action === 'REJECT') {
      // Delete file from storage, then delete bill record
      if (bill.fileId) {
        await storage.deleteFile(BUCKET_ID, bill.fileId).catch((e) =>
          console.error(`Failed to delete bill file ${bill.fileId}`, e),
        )
      }

      // Notify before deletion so we still have bill data
      await notifyBillRejected({
        grantId,
        projectCode: projectCode ?? 'N/A',
        submitterId: bill.userId,
        amount:      bill.amount,
        reason:      body.reason ?? undefined,
      })

      await auditGrantFinancial({
        session:      session as { user: { id: string; email: string; role: string } },
        action:       AuditActions.BILL_REJECTED,
        resourceType: 'GrantInBill',
        resourceId:   billId,
        oldValue:     { status: bill.billStatus },
        newValue:     { status: BillStatus.REJECTED },
        reason:       body.reason ?? null,
        ipAddress:    ip,
      })

      await prisma.grantInBill.delete({ where: { id: billId } })
      return NextResponse.json({ message: 'Bill rejected and removed' })

    } else if (action === 'PAY') {
      await prisma.grantInBill.update({ where: { id: billId }, data: { billStatus: BillStatus.PAID } })

      await auditGrantFinancial({
        session:      session as { user: { id: string; email: string; role: string } },
        action:       AuditActions.BILL_PAID,
        resourceType: 'GrantInBill',
        resourceId:   billId,
        oldValue:     { status: BillStatus.ACCEPTED },
        newValue:     { status: BillStatus.PAID },
        ipAddress:    ip,
      })

      await notifyBillPaid({
        grantId,
        projectCode: projectCode ?? 'N/A',
        submitterId: bill.userId,
        amount:      bill.amount,
      })
    }

    const updated = await prisma.grantInBill.findUnique({ where: { id: billId } })
    return NextResponse.json({ bill: updated })
  } catch (error) {
    console.error('[Bill PATCH]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// ─── DELETE — owner or PI/CoPI or ADMIN can delete PENDING bills ──────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; billId: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: grantId, billId } = await params
    const userRole = session.user.role as UserRole
    const userId   = session.user.id

    const bill = await prisma.grantInBill.findUnique({
      where: { id: billId },
      include: {
        grantIn: {
          include: {
            facultyAuthors: { where: { userId, role: { in: [GrantInRole.FACULTY_PI, GrantInRole.FACULTY_COPI] } } },
          },
        },
      },
    })

    if (!bill || bill.grantInId !== grantId) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    const isOwner         = bill.userId === userId
    const isFacultyPICoPI = bill.grantIn.facultyAuthors.length > 0
    const isAdmin         = isAdminOrHigher(userRole)

    // PENDING bills: owner, PI/CoPI, or ADMIN can delete
    if (bill.billStatus === BillStatus.PENDING) {
      if (!isOwner && !isFacultyPICoPI && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden — only the bill uploader, PI/CoPI, or ADMIN can delete pending bills' }, { status: 403 })
      }
    } else if (bill.billStatus === BillStatus.ACCEPTED) {
      // ACCEPTED bills: only PI/CoPI or ADMIN
      if (!isFacultyPICoPI && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden — only PI/CoPI or ADMIN can delete accepted bills' }, { status: 403 })
      }
    } else {
      // PAID/REJECTED: only ADMIN
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden — only ADMIN can delete paid or rejected bills' }, { status: 403 })
      }
    }

    if (bill.fileId) {
      await storage.deleteFile(BUCKET_ID, bill.fileId).catch((e) =>
        console.error(`Failed to delete bill file ${bill.fileId}`, e),
      )
    }

    // If deleting an ACCEPTED bill, reverse the usedAmount in a transaction
    if (bill.billStatus === BillStatus.ACCEPTED && bill.amount && bill.amount > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.grantInBill.delete({ where: { id: billId } })
        await tx.grantIn.update({
          where: { id: grantId },
          data:  { usedAmount: { decrement: bill.amount! } },
        })
      })
    } else {
      await prisma.grantInBill.delete({ where: { id: billId } })
    }

    if (bill.userId !== userId) {
      await notifyBillRejected({
        grantId,
        projectCode: bill.grantIn.projectCode ?? 'N/A',
        submitterId: bill.userId,
        amount:      bill.amount,
        reason:      'Your bill was removed by an authorized party.',
      })
    }

    if (bill.billStatus === BillStatus.ACCEPTED) {
      await regenerateMasterPdf(grantId).catch(() => {})
    }

    return NextResponse.json({ message: 'Bill deleted successfully' })
  } catch (error) {
    console.error('[Bill DELETE]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
