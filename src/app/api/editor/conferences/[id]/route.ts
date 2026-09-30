import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/auth/guard";
import { ConferenceStatus, TeacherStatus, Prisma } from "@prisma/client";
import { safeUpdate } from "@/lib/api/security";
import { pickAllowedFields, CONFERENCE_EDITOR_FIELDS } from "@/lib/auth/field-allowlists";
import { successResponse, updatedResponse, notFoundResponse, badRequestResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/error-handler";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const conf = await prisma.conference.findUnique({
      where: { id },
      include: {
        studentAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
        facultyAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
        grantMappings:  { include: { grantIn: { select: { id: true, projectCode: true } } } },
      },
    });

    if (!conf) return notFoundResponse("Conference");
    return successResponse(conf);
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

    if (body.conferenceStatus && !Object.values(ConferenceStatus).includes(body.conferenceStatus)) {
      return badRequestResponse("Invalid conferenceStatus");
    }
    if (body.teacherStatus && !Object.values(TeacherStatus).includes(body.teacherStatus)) {
      return badRequestResponse("Invalid teacherStatus");
    }

    const allowedData = pickAllowedFields(body, CONFERENCE_EDITOR_FIELDS);
    const data: Prisma.ConferenceUpdateInput = { ...allowedData };
    if (body.conferenceDate !== undefined) data.conferenceDate = body.conferenceDate ? new Date(body.conferenceDate) : null;
    if (body.statusDate     !== undefined) data.statusDate     = body.statusDate     ? new Date(body.statusDate)     : null;

    const result = await safeUpdate(prisma.conference, id, data, "Conference");
    if (!result.success) return result.response;

    return updatedResponse(result.data, "Conference updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
