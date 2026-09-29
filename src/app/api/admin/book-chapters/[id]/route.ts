import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { BookchapterStatus, TeacherStatus } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  try {
    const bc = await prisma.bookChapter.findUnique({
      where: { id: params.id },
      include: {
        studentAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
        facultyAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
        grantMappings: { include: { grantIn: { select: { id: true, projectCode: true, amountGranted: true } } } },
      },
    });
    if (!bc) return NextResponse.json({ error: "Book chapter not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: bc });
  } catch (e) { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  try {
    if (!await prisma.bookChapter.findUnique({ where: { id: params.id } })) {
      return NextResponse.json({ error: "Book chapter not found" }, { status: 404 });
    }
    const body = await req.json();
    if (body.bookChapterStatus && !Object.values(BookchapterStatus).includes(body.bookChapterStatus))
      return NextResponse.json({ error: "Invalid bookChapterStatus" }, { status: 400 });
    if (body.teacherStatus && !Object.values(TeacherStatus).includes(body.teacherStatus))
      return NextResponse.json({ error: "Invalid teacherStatus" }, { status: 400 });

    const data: any = {};
    for (const f of ["bookChapterStatus","teacherStatus","isPublic","title","abstract","isbnIssn",
      "publisher","doi","keywords","registrationFees","reimbursement","imageUrl","documentUrl","updateComment"]) {
      if (body[f] !== undefined) data[f] = body[f];
    }
    if (body.publicationDate !== undefined) data.publicationDate = body.publicationDate ? new Date(body.publicationDate) : null;

    const bc = await prisma.bookChapter.update({ where: { id: params.id }, data });
    return NextResponse.json({ success: true, data: bc });
  } catch (e) { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  try {
    if (!await prisma.bookChapter.findUnique({ where: { id: params.id } }))
      return NextResponse.json({ error: "Book chapter not found" }, { status: 404 });
    await prisma.bookChapter.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: "Book chapter deleted" });
  } catch (e) { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
