/**
 * GET  /api/admin/events  — list all events (EDITOR+)
 * POST /api/admin/events  — create event (EDITOR+), starts as DRAFT
 *
 * EDITOR is the primary event manager per spec (not ADMIN-only).
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEditor } from '@/lib/auth/guard'
import { EventStatus } from '@prisma/client'
import { AuditActions, writeAuditLog, fromSession } from '@/lib/audit'
import { getClientIp } from '@/lib/auth/guard'

export async function GET(req: NextRequest) {
  try {
    const guard = await requireEditor(req)
    if (!guard.ok) return guard.response

    const searchParams = req.nextUrl.searchParams
    const statusFilter = searchParams.get('status') as EventStatus | null

    const where: any = {}
    if (statusFilter && Object.values(EventStatus).includes(statusFilter)) {
      where.eventStatus = statusFilter
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { eventDate: 'desc' },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('[Events GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireEditor(req)
    if (!guard.ok) return guard.response
    const { session } = guard
    const ip = await getClientIp(req)

    const body = await req.json()
    const { name, posterUrl, registrationCost, description, registrationLink, contactName, contactPhone, eventDate } = body

    if (!name || !description || !registrationLink || !contactName || !contactPhone || !eventDate) {
      return NextResponse.json({ error: 'Missing required fields: name, description, registrationLink, contactName, contactPhone, eventDate' }, { status: 400 })
    }

    // Validate date
    const parsedDate = new Date(eventDate)
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'Invalid eventDate' }, { status: 400 })
    }

    // Validate registration cost
    if (registrationCost !== undefined && registrationCost !== null && parseFloat(registrationCost) < 0) {
      return NextResponse.json({ error: 'registrationCost cannot be negative' }, { status: 400 })
    }

    // New events always start as DRAFT — client cannot override
    const event = await prisma.event.create({
      data: {
        name,
        posterUrl:        posterUrl        ?? null,
        registrationCost: registrationCost != null ? parseFloat(registrationCost) : null,
        description,
        registrationLink,
        contactName,
        contactPhone,
        eventDate:        parsedDate,
        eventStatus:      EventStatus.DRAFT, // always DRAFT on creation
      },
    })

    await writeAuditLog({
      ...fromSession(session as { user: { id: string; email: string; role: string } }),
      action:       AuditActions.EVENT_CREATED,
      resourceType: 'Event',
      resourceId:   event.id,
      newValue:     { name, eventStatus: EventStatus.DRAFT },
      ipAddress:    ip,
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('[Events POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
