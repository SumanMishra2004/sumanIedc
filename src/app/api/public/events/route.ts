import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const includePast = searchParams.get("includePast") === "true"

    const where: any = {}

    if (!includePast) {
      // Set boundary at the beginning of today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      where.eventDate = {
        gte: today,
      }
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: {
        eventDate: "asc",
      },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Error fetching public events:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
