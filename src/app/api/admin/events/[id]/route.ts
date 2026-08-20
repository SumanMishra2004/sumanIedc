/**
 * GET    /api/admin/events/[id]  — EDITOR+
 * PATCH  /api/admin/events/[id]  — EDITOR+: edit fields + status transitions via workflow engine
 * DELETE /api/admin/events/[id]  — ADMIN+ only (hard delete; use ARCHIVE in normal flow)
 *
 * Status lifecycle (enforced server-side):
 *   DRAFT → PUBLISHED
 *   PUBLISHED → CANCELLED | ARCHIVED | DRAFT (ADMIN only)
 *   CANCELLED → ARCHIVED
 *   ARCHIVED → PUBLISHED (SUPERADMIN only)
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEditor, requireAdmin, getClientIp } from '@/lib/auth/guard'
import { canManageEvents } from '@/lib/auth/permissions'
import { validateEventStatusTransition } from '@/lib/auth/workflow'
import {
  pickAllowedFields,
  EVENT_EDITOR_FIELDS,
  EVENT_EDITOR_STATUS_FIELDS,
} from '@/lib/auth/field-allowlists'
import { AuditActions, writeAuditLog, fromSession } from '@/lib/audit'
import { EventStatus } from '@prisma/client'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await requireEditor(req)
    if (!guard.ok) return guard.response
    const { id } = await params

    const event = await prisma.event.findUnique({ where: { id } })
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    return NextResponse.json({ event })
  } catch (error) {
    console.error('[Event GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await requireEditor(req)
    if (!guard.ok) return guard.response
    const { session } = guard
    const { id } = await params
    const body = await req.json()
    const { role } = session.user
    const ip = await getClientIp(req)

    const existing = await prisma.event.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    // Apply per-role field allowlist
    const allowlist = canManageEvents(role) ? EVENT_EDITOR_STATUS_FIELDS : EVENT_EDITOR_FIELDS
    const safeBody  = pickAllowedFields(body, allowlist) as Record<string, unknown>

    // Validate status transition if requested
    const newStatus = safeBody.eventStatus as EventStatus | undefined
    if (newStatus && newStatus !== existing.eventStatus) {
      const transition = validateEventStatusTransition(role, existing.eventStatus, newStatus)
      if (!transition.allowed) {
        return NextResponse.json(
          { error: (transition as { allowed: false; reason: string }).reason },
          { status: (transition as { allowed: false; status: number }).status },
        )
      }
    }

    // Validate eventDate if provided
    if (safeBody.eventDate !== undefined) {
      const parsedDate = new Date(safeBody.eventDate as string)
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Invalid eventDate' }, { status: 400 })
      }
      safeBody.eventDate = parsedDate
    }

    // Validate registrationCost
    if (safeBody.registrationCost !== undefined && safeBody.registrationCost !== null) {
      const cost = parseFloat(safeBody.registrationCost as string)
      if (isNaN(cost) || cost < 0) {
        return NextResponse.json({ error: 'registrationCost must be a non-negative number' }, { status: 400 })
      }
      safeBody.registrationCost = cost
    }

    const updated = await prisma.event.update({ where: { id }, data: safeBody })

    // Audit status changes
    if (newStatus && newStatus !== existing.eventStatus) {
      const actionMap: Record<string, (typeof AuditActions)[keyof typeof AuditActions]> = {
        PUBLISHED:  AuditActions.EVENT_PUBLISHED,
        CANCELLED:  AuditActions.EVENT_CANCELLED,
        ARCHIVED:   AuditActions.EVENT_ARCHIVED,
      }
      const action = actionMap[newStatus] ?? AuditActions.EVENT_CREATED

      await writeAuditLog({
        ...fromSession(session as { user: { id: string; email: string; role: string } }),
        action,
        resourceType: 'Event',
        resourceId:   id,
        oldValue:     { eventStatus: existing.eventStatus },
        newValue:     { eventStatus: newStatus },
        ipAddress:    ip,
      })
    }

    return NextResponse.json({ event: updated })
  } catch (error) {
    console.error('[Event PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Hard delete requires ADMIN+ (preferred flow is ARCHIVE via PATCH)
    const guard = await requireAdmin(req)
    if (!guard.ok) return guard.response
    const { id } = await params

    const existing = await prisma.event.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    await prisma.event.delete({ where: { id } })
    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('[Event DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
