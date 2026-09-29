import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/auth/guard";
import { EventStatus } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;
  try {
    const event = await prisma.event.findUnique({ where: { id: params.id } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: event });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;
  try {
    const existing = await prisma.event.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    // Cannot edit a CANCELLED or ARCHIVED event
    if (existing.eventStatus === "CANCELLED" || existing.eventStatus === "ARCHIVED") {
      return NextResponse.json({ error: `Cannot edit a ${existing.eventStatus.toLowerCase()} event` }, { status: 400 });
    }

    const body = await req.json();
    if (body.eventStatus && !Object.values(EventStatus).includes(body.eventStatus)) {
      return NextResponse.json({ error: "Invalid eventStatus" }, { status: 400 });
    }

    const updateData: any = {};
    for (const f of ["name", "posterUrl", "description", "registrationLink",
      "contactName", "contactPhone", "registrationCost", "eventStatus"]) {
      if (body[f] !== undefined) updateData[f] = body[f];
    }
    if (body.eventDate !== undefined) updateData.eventDate = body.eventDate ? new Date(body.eventDate) : null;

    const event = await prisma.event.update({ where: { id: params.id }, data: updateData });
    return NextResponse.json({ success: true, data: event });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;
  try {
    const existing = await prisma.event.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if (existing.eventStatus === "PUBLISHED") {
      return NextResponse.json({ error: "Cannot delete a published event — archive it instead" }, { status: 400 });
    }
    await prisma.event.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: "Event deleted successfully" });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
