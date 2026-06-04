import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// Admin verification helper
async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return null
  }
  return session
}

// GET - List all events (including past ones) for admin dashboard
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized — ADMIN access required" },
        { status: 403 }
      )
    }

    const events = await prisma.event.findMany({
      orderBy: {
        eventDate: "desc",
      },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Error fetching admin events:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create a new event
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized — ADMIN access required" },
        { status: 403 }
      )
    }

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

    // Validation
    if (!name || !description || !registrationLink || !contactName || !contactPhone || !eventDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const event = await prisma.event.create({
      data: {
        name,
        posterUrl: posterUrl || null,
        registrationCost: registrationCost !== undefined && registrationCost !== null ? parseFloat(registrationCost) : null,
        description,
        registrationLink,
        contactName,
        contactPhone,
        eventDate: new Date(eventDate),
      },
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
