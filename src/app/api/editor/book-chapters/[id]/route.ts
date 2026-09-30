import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/auth/guard";
import { BookchapterStatus, TeacherStatus, Prisma } from "@prisma/client";
import { safeUpdate } from "@/lib/api/security";
import { pickAllowedFields, BOOK_CHAPTER_EDITOR_FIELDS } from "@/lib/auth/field-allowlists";
import { successResponse, updatedResponse, notFoundResponse, badRequestResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/error-handler";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const bc = await prisma.bookChapter.findUnique({
      where: { id },
      include: {
        studentAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
        facultyAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
        grantMappings:  { include: { grantIn: { select: { id: true, projectCode: true } } } },
      },
    });

    if (!bc) return notFoundResponse("Book chapter");
    return successResponse(bc);
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

    if (body.bookChapterStatus && !Object.values(BookchapterStatus).includes(body.bookChapterStatus)) {
      return badRequestResponse("Invalid bookChapterStatus");
    }
    if (body.teacherStatus && !Object.values(TeacherStatus).includes(body.teacherStatus)) {
      return badRequestResponse("Invalid teacherStatus");
    }

    const allowedData = pickAllowedFields(body, BOOK_CHAPTER_EDITOR_FIELDS);
    const data: Prisma.BookChapterUpdateInput = { ...allowedData };
    if (body.publicationDate !== undefined) {
      data.publicationDate = body.publicationDate ? new Date(body.publicationDate) : null;
    }

    const result = await safeUpdate(prisma.bookChapter, id, data, "Book chapter");
    if (!result.success) return result.response;

    return updatedResponse(result.data, "Book chapter updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
