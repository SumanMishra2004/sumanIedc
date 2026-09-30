import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/auth/guard";
import { CopyrightStatus, TeacherStatus, Prisma } from "@prisma/client";
import { safeUpdate } from "@/lib/api/security";
import { pickAllowedFields, COPYRIGHT_EDITOR_FIELDS } from "@/lib/auth/field-allowlists";
import { successResponse, updatedResponse, notFoundResponse, badRequestResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/error-handler";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const copyright = await prisma.copyright.findUnique({
      where: { id },
      include: {
        studentAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
        facultyAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
        grantMappings:  { include: { grantIn: { select: { id: true, projectCode: true } } } },
      },
    });

    if (!copyright) return notFoundResponse("Copyright");
    return successResponse(copyright);
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

    if (body.copyrightStatus && !Object.values(CopyrightStatus).includes(body.copyrightStatus)) {
      return badRequestResponse("Invalid copyrightStatus");
    }
    if (body.teacherStatus   && !Object.values(TeacherStatus).includes(body.teacherStatus)) {
      return badRequestResponse("Invalid teacherStatus");
    }

    const allowedData = pickAllowedFields(body, COPYRIGHT_EDITOR_FIELDS);
    const data: Prisma.CopyrightUpdateInput = { ...allowedData };

    for (const df of ["dateOfFiling", "dateOfSubmission", "dateOfPublished", "dateOfGrant"] as const) {
      if (body[df] !== undefined) data[df] = body[df] ? new Date(body[df]) : null;
    }

    const result = await safeUpdate(prisma.copyright, id, data, "Copyright");
    if (!result.success) return result.response;

    return updatedResponse(result.data, "Copyright updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
