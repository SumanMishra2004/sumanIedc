import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/auth/guard";
import { BookchapterStatus, TeacherStatus } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;
  try {
    const bc = await prisma.bookChapter.findUnique({
      where: { id: params.id },
      include: {
        studentAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
        facultyAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
        grantMappings: { include: { grantIn: { select: { id: true, projectCode: true } } } },
      },
    });
    if (!bc) return NextResponse.json({ error: "Book chapter not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: bc });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;
  try {
    const existing = await prisma.bookChapter.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Book chapter not found" }, { status: 404 });

    const body = await req.json();
    if (body.bookChapterStatus && !Object.values(BookchapterStatus).includes(body.bookChapterStatus)) {
      return NextResponse.json({ error: "Invalid bookChapterStatus" }, { status: 400 });
    }
    if (body.teacherStatus && !Object.values(TeacherStatus).includes(body.teacherStatus)) {
      return NextResponse.json({ error: "Invalid teacherStatus" }, { status: 400 });
    }

    const updateData: any = {};
    const fields = ["bookChapterStatus", "teacherStatus", "isPublic", "title", "abstract",
      "isbnIssn", "publisher", "doi", "keywords", "registrationFees", "reimbursement",
      "imageUrl", "documentUrl", "updateComment"];
    for (const f of fields) { if (body[f] !== undefined) updateData[f] = body[f]; }
    if (body.publicationDate !== undefined) updateData.publicationDate = body.publicationDate ? new Date(body.publicationDate) : null;

    const bc = await prisma.bookChapter.update({ where: { id: params.id }, data: updateData });
    return NextResponse.json({ success: true, data: bc });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
