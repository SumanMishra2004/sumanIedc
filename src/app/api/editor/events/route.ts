import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/auth/guard";
import { EventStatus } from "@prisma/client";

// GET /api/editor/events
export async function GET(req: NextRequest) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, parseInt(searchParams.get("page")  || "1"));
  const limit  = Math.min(100, parseInt(searchParams.get("limit") || "20"));
  const skip   = (page - 1) * limit;
  const status = searchParams.get("status")?.toUpperCase() as EventStatus | undefined;
  const search = searchParams.get("search");

  const where: any = {};
  if (status && Object.values(EventStatus).includes(status)) where.eventStatus = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [data, total] = await Promise.all([
      prisma.event.findMany({ where, skip, take: limit, orderBy: { eventDate: "desc" } }),
      prisma.event.count({ where }),
    ]);
    return NextResponse.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/editor/events - create event (always starts DRAFT)
export async function POST(req: NextRequest) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json();
    const { name, posterUrl, registrationCost, description, registrationLink, contactName, contactPhone, eventDate } = body;

    if (!name || !description || !registrationLink || !contactName || !contactPhone || !eventDate) {
      return NextResponse.json(
        { error: "Missing required fields: name, description, registrationLink, contactName, contactPhone, eventDate" },
        { status: 400 }
      );
    }

    const parsedDate = new Date(eventDate);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid eventDate" }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        name,
        posterUrl: posterUrl ?? null,
        registrationCost: registrationCost != null ? parseFloat(registrationCost) : null,
        description,
        registrationLink,
        contactName,
        contactPhone,
        eventDate: parsedDate,
        eventStatus: "DRAFT",
      },
    });

    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
