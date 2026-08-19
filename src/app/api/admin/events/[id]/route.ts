import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { isAdminOrHigher } from "@/lib/auth/permissions"

// Admin verification helper
async function requireAdmin() {
  const session = await auth()
  if (!session?.user || !isAdminOrHigher(session.user.role)) {
    return null
  }
  return session
}

// GET - Get single event details
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized — ADMIN access required" },
        { status: 403 }
      )
    }

    const { id } = await params
    const event = await prisma.event.findUnique({
      where: { id },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error("Error fetching admin event details:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH - Update single event details
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized — ADMIN access required" },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const {
      name,
      posterUrl,
      registrationCost,
      description,
      registrationLink,
      contactName,
      contactPhone,
      eventDate,
    } = body

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Build update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (posterUrl !== undefined) updateData.posterUrl = posterUrl
    if (registrationCost !== undefined) {
      updateData.registrationCost = registrationCost !== null ? parseFloat(registrationCost) : null
    }
    if (description !== undefined) updateData.description = description
    if (registrationLink !== undefined) updateData.registrationLink = registrationLink
    if (contactName !== undefined) updateData.contactName = contactName
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone
    if (eventDate !== undefined) updateData.eventDate = eventDate ? new Date(eventDate) : undefined

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ event: updatedEvent })
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Remove an event
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized — ADMIN access required" },
        { status: 403 }
      )
    }

    const { id } = await params

    const existingEvent = await prisma.event.findUnique({
      where: { id },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    await prisma.event.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
