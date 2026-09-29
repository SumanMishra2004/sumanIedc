import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/auth/guard";
import { PatentStatus, TeacherStatus } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;
  try {
    const patent = await prisma.patent.findUnique({
      where: { id: params.id },
      include: {
        studentAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
        facultyAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
        grantMappings: { include: { grantIn: { select: { id: true, projectCode: true } } } },
      },
    });
    if (!patent) return NextResponse.json({ error: "Patent not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: patent });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;
  try {
    const existing = await prisma.patent.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Patent not found" }, { status: 404 });

    const body = await req.json();
    if (body.patentStatus && !Object.values(PatentStatus).includes(body.patentStatus)) {
      return NextResponse.json({ error: "Invalid patentStatus" }, { status: 400 });
    }
    if (body.teacherStatus && !Object.values(TeacherStatus).includes(body.teacherStatus)) {
      return NextResponse.json({ error: "Invalid teacherStatus" }, { status: 400 });
    }

    const updateData: any = {};
    const fields = ["patentStatus", "teacherStatus", "isPublic", "title", "keywords",
      "abstract", "applicationNo", "grantedPatentNo", "patentLink", "imageUrl", "documentUrl", "updateComment"];
    for (const f of fields) { if (body[f] !== undefined) updateData[f] = body[f]; }
    for (const dateField of ["filingDate", "submissionDate", "publicationDate", "grantDate"]) {
      if (body[dateField] !== undefined) updateData[dateField] = body[dateField] ? new Date(body[dateField]) : null;
    }

    const patent = await prisma.patent.update({ where: { id: params.id }, data: updateData });
    return NextResponse.json({ success: true, data: patent });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
