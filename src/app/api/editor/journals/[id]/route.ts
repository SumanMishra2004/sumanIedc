import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/auth/guard";
import { TeacherStatus, JournalStatus, Prisma } from "@prisma/client";
import { safeUpdate } from "@/lib/api/security";
import { pickAllowedFields, JOURNAL_EDITOR_FIELDS } from "@/lib/auth/field-allowlists";
import { successResponse, updatedResponse, notFoundResponse, badRequestResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/error-handler";

const authorInclude = {
  studentAuthors: { include: { user: { select: { id: true, name: true, email: true, image: true, department: true } } } },
  facultyAuthors: { include: { user: { select: { id: true, name: true, email: true, image: true, department: true } } } },
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const journal = await prisma.journal.findUnique({
      where: { id },
      include: {
        ...authorInclude,
        grantMappings: { include: { grantIn: { select: { id: true, projectCode: true, amountGranted: true } } } },
      },
    });

    if (!journal) return notFoundResponse("Journal");
    return successResponse(journal);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await req.json();

    if (body.teacherStatus  && !Object.values(TeacherStatus).includes(body.teacherStatus)) {
      return badRequestResponse("Invalid teacherStatus");
    }
    if (body.journalStatus  && !Object.values(JournalStatus).includes(body.journalStatus)) {
      return badRequestResponse("Invalid journalStatus");
    }

    const allowedData = pickAllowedFields(body, JOURNAL_EDITOR_FIELDS);
    if (Object.keys(allowedData).length === 0) {
      return badRequestResponse("No valid fields to update");
    }

    const data: Prisma.JournalUpdateInput = { ...allowedData };
    if (body.publicationDate  !== undefined) data.publicationDate  = body.publicationDate  ? new Date(body.publicationDate)  : null;
    if (body.impactFactorDate !== undefined) data.impactFactorDate = body.impactFactorDate ? new Date(body.impactFactorDate) : null;

    const result = await safeUpdate(prisma.journal, id, data, "Journal");
    if (!result.success) return result.response;

    const journal = await prisma.journal.findUnique({ where: { id: result.data.id }, include: authorInclude });
    return updatedResponse(journal, "Journal updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
