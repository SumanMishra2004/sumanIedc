import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/auth/guard";
import { ConferenceStatus, TeacherStatus, ConferenceMode } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;
  try {
    const conf = await prisma.conference.findUnique({
      where: { id: params.id },
      include: {
        studentAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
        facultyAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
        grantMappings: { include: { grantIn: { select: { id: true, projectCode: true } } } },
      },
    });
    if (!conf) return NextResponse.json({ error: "Conference not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: conf });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;
  try {
    const existing = await prisma.conference.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Conference not found" }, { status: 404 });

    const body = await req.json();
    if (body.conferenceStatus && !Object.values(ConferenceStatus).includes(body.conferenceStatus)) {
      return NextResponse.json({ error: "Invalid conferenceStatus" }, { status: 400 });
    }
    if (body.teacherStatus && !Object.values(TeacherStatus).includes(body.teacherStatus)) {
      return NextResponse.json({ error: "Invalid teacherStatus" }, { status: 400 });
    }

    const updateData: any = {};
    const fields = ["conferenceStatus", "teacherStatus", "isPublic", "conferenceName", "mode",
      "abstract", "keywords", "conferencePublisher", "paperDoi", "paperLink", "paperName",
      "registrationFees", "reimbursement", "imageUrl", "documentUrl", "updateComment"];
    for (const f of fields) { if (body[f] !== undefined) updateData[f] = body[f]; }
    if (body.conferenceDate !== undefined) updateData.conferenceDate = body.conferenceDate ? new Date(body.conferenceDate) : null;
    if (body.statusDate !== undefined) updateData.statusDate = body.statusDate ? new Date(body.statusDate) : null;

    const conf = await prisma.conference.update({ where: { id: params.id }, data: updateData });
    return NextResponse.json({ success: true, data: conf });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
