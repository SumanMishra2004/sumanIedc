import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { FDPStatus } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  try {
    const fdp = await prisma.fDP.findUnique({
      where: { id: params.id },
      include: { user: { select: { id: true, name: true, email: true, department: true, role: true } } },
    });
    if (!fdp) return NextResponse.json({ error: "FDP not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: fdp });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  try {
    if (!await prisma.fDP.findUnique({ where: { id: params.id } }))
      return NextResponse.json({ error: "FDP not found" }, { status: 404 });

    const body = await req.json();
    if (body.fdpStatus && !Object.values(FDPStatus).includes(body.fdpStatus))
      return NextResponse.json({ error: "Invalid fdpStatus" }, { status: 400 });

    const data: any = {};
    for (const f of ["fdpStatus","isPublic","title","description","keywords","organizedBy","topic","duration","remark","updateComment"]) {
      if (body[f] !== undefined) data[f] = body[f];
    }
    for (const df of ["startDate","endDate"]) {
      if (body[df] !== undefined) data[df] = body[df] ? new Date(body[df]) : null;
    }

    const fdp = await prisma.fDP.update({ where: { id: params.id }, data });
    return NextResponse.json({ success: true, data: fdp });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  try {
    if (!await prisma.fDP.findUnique({ where: { id: params.id } }))
      return NextResponse.json({ error: "FDP not found" }, { status: 404 });
    await prisma.fDP.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: "FDP deleted" });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
