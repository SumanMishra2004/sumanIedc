import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/auth/guard";
import { FDPStatus } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;
  try {
    const fdp = await prisma.fDP.findUnique({
      where: { id: params.id },
      include: { user: { select: { id: true, name: true, email: true, department: true, role: true } } },
    });
    if (!fdp) return NextResponse.json({ error: "FDP not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: fdp });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;
  try {
    const existing = await prisma.fDP.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "FDP not found" }, { status: 404 });

    const body = await req.json();
    if (body.fdpStatus && !Object.values(FDPStatus).includes(body.fdpStatus)) {
      return NextResponse.json({ error: "Invalid fdpStatus" }, { status: 400 });
    }

    const updateData: any = {};
    for (const f of ["fdpStatus", "isPublic", "title", "description", "keywords",
      "organizedBy", "topic", "duration", "remark", "updateComment"]) {
      if (body[f] !== undefined) updateData[f] = body[f];
    }
    for (const df of ["startDate", "endDate"]) {
      if (body[df] !== undefined) updateData[df] = body[df] ? new Date(body[df]) : null;
    }

    const fdp = await prisma.fDP.update({ where: { id: params.id }, data: updateData });
    return NextResponse.json({ success: true, data: fdp });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
