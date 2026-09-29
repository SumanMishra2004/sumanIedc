import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/auth/guard";
import { CopyrightStatus, TeacherStatus } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;
  try {
    const copyright = await prisma.copyright.findUnique({
      where: { id: params.id },
      include: {
        studentAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
        facultyAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
        grantMappings: { include: { grantIn: { select: { id: true, projectCode: true } } } },
      },
    });
    if (!copyright) return NextResponse.json({ error: "Copyright not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: copyright });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;
  try {
    const existing = await prisma.copyright.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Copyright not found" }, { status: 404 });

    const body = await req.json();
    if (body.copyrightStatus && !Object.values(CopyrightStatus).includes(body.copyrightStatus)) {
      return NextResponse.json({ error: "Invalid copyrightStatus" }, { status: 400 });
    }
    if (body.teacherStatus && !Object.values(TeacherStatus).includes(body.teacherStatus)) {
      return NextResponse.json({ error: "Invalid teacherStatus" }, { status: 400 });
    }

    const updateData: any = {};
    const fields = ["copyrightStatus", "teacherStatus", "isPublic", "regNo", "title", "abstract",
      "registrationFees", "reimbursement", "imageUrl", "documentUrl", "updateComment"];
    for (const f of fields) { if (body[f] !== undefined) updateData[f] = body[f]; }
    for (const df of ["dateOfFiling", "dateOfSubmission", "dateOfPublished", "dateOfGrant"]) {
      if (body[df] !== undefined) updateData[df] = body[df] ? new Date(body[df]) : null;
    }

    const copyright = await prisma.copyright.update({ where: { id: params.id }, data: updateData });
    return NextResponse.json({ success: true, data: copyright });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
