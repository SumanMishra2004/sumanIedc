import prisma from "@/lib/prisma"
import { EventStatus } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const includePast = searchParams.get("includePast") === "true"

    // HARD LOCK: public events API only returns PUBLISHED events.
    // EventStatus is never overridable by client query params.
    const where: any = {
      eventStatus: EventStatus.PUBLISHED,
    }

    if (!includePast) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      where.eventDate = { gte: today }
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { eventDate: "asc" },
      select: {
        id: true,
        name: true,
        posterUrl: true,
        registrationCost: true,
        description: true,
        registrationLink: true,
        contactName: true,
        contactPhone: true,
        eventDate: true,
        eventStatus: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Error fetching public events:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
