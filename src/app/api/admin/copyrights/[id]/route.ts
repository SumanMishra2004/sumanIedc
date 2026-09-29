import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { CopyrightStatus, TeacherStatus } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  try {
    const copyright = await prisma.copyright.findUnique({
      where: { id: params.id },
      include: {
        studentAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
        facultyAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
        grantMappings:  { include: { grantIn: { select: { id: true, projectCode: true, amountGranted: true } } } },
      },
    });
    if (!copyright) return NextResponse.json({ error: "Copyright not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: copyright });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  try {
    if (!await prisma.copyright.findUnique({ where: { id: params.id } }))
      return NextResponse.json({ error: "Copyright not found" }, { status: 404 });

    const body = await req.json();
    if (body.copyrightStatus && !Object.values(CopyrightStatus).includes(body.copyrightStatus))
      return NextResponse.json({ error: "Invalid copyrightStatus" }, { status: 400 });
    if (body.teacherStatus   && !Object.values(TeacherStatus).includes(body.teacherStatus))
      return NextResponse.json({ error: "Invalid teacherStatus" }, { status: 400 });

    const data: any = {};
    for (const f of ["copyrightStatus","teacherStatus","isPublic","regNo","title","abstract",
      "registrationFees","reimbursement","imageUrl","documentUrl","updateComment"]) {
      if (body[f] !== undefined) data[f] = body[f];
    }
    for (const df of ["dateOfFiling","dateOfSubmission","dateOfPublished","dateOfGrant"]) {
      if (body[df] !== undefined) data[df] = body[df] ? new Date(body[df]) : null;
    }

    const copyright = await prisma.copyright.update({ where: { id: params.id }, data });
    return NextResponse.json({ success: true, data: copyright });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  try {
    if (!await prisma.copyright.findUnique({ where: { id: params.id } }))
      return NextResponse.json({ error: "Copyright not found" }, { status: 404 });
    await prisma.copyright.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: "Copyright deleted" });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
