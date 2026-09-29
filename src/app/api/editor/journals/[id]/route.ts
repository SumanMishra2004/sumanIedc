import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/auth/guard";
import {
  TeacherStatus,
  JournalStatus,
  JournalScope,
  JournalReviewType,
  JournalAccessType,
  JournalIndexing,
  JournalQuartile,
  JournalPublicationMode,
} from "@prisma/client";

const authorInclude = {
  studentAuthors: {
    include: { user: { select: { id: true, name: true, email: true, image: true, department: true } } },
  },
  facultyAuthors: {
    include: { user: { select: { id: true, name: true, email: true, image: true, department: true } } },
  },
};

// GET /api/editor/journals/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;

  try {
    const journal = await prisma.journal.findUnique({
      where: { id: params.id },
      include: {
        ...authorInclude,
        grantMappings: { include: { grantIn: { select: { id: true, projectCode: true, amountGranted: true } } } },
      },
    });
    if (!journal) return NextResponse.json({ error: "Journal not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: journal });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/editor/journals/[id] — status changes + field edits
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;

  try {
    const existing = await prisma.journal.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Journal not found" }, { status: 404 });

    const body = await req.json();

    const TEACHER_STATUSES = Object.values(TeacherStatus);
    const JOURNAL_STATUSES = Object.values(JournalStatus);

    if (body.teacherStatus && !TEACHER_STATUSES.includes(body.teacherStatus)) {
      return NextResponse.json({ error: "Invalid teacherStatus" }, { status: 400 });
    }
    if (body.journalStatus && !JOURNAL_STATUSES.includes(body.journalStatus)) {
      return NextResponse.json({ error: "Invalid journalStatus" }, { status: 400 });
    }

    const updateData: any = {};
    const fields = [
      "teacherStatus", "journalStatus", "isPublic", "doi", "publisher",
      "impactFactor", "quartile", "indexing", "paperLink", "scope",
      "reviewType", "accessType", "publicationMode", "title", "journalName",
      "abstract", "serialNo", "imageUrl", "documentUrl", "keywords",
      "registrationFees", "reimbursement", "updateComment",
    ];
    for (const f of fields) {
      if (body[f] !== undefined) updateData[f] = body[f];
    }
    if (body.publicationDate !== undefined) {
      updateData.publicationDate = body.publicationDate ? new Date(body.publicationDate) : null;
    }
    if (body.impactFactorDate !== undefined) {
      updateData.impactFactorDate = body.impactFactorDate ? new Date(body.impactFactorDate) : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const journal = await prisma.journal.update({ where: { id: params.id }, data: updateData, include: authorInclude });
    return NextResponse.json({ success: true, data: journal });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
