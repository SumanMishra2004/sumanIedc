import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/auth/guard";
import { FDPStatus, Prisma } from "@prisma/client";
import { safeUpdate } from "@/lib/api/security";
import { successResponse, updatedResponse, notFoundResponse, badRequestResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/error-handler";

// FDP editor allowlist
const FDP_EDITOR_FIELDS = [
  "fdpStatus", "isPublic", "title", "description", "keywords",
  "organizedBy", "topic", "duration", "remark", "updateComment",
] as const;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const fdp = await prisma.fDP.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true, department: true, role: true } } },
    });

    if (!fdp) return notFoundResponse("FDP");
    return successResponse(fdp);
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

    if (body.fdpStatus && !Object.values(FDPStatus).includes(body.fdpStatus)) {
      return badRequestResponse("Invalid fdpStatus");
    }

    const allowedData: Record<string, unknown> = {};
    for (const f of FDP_EDITOR_FIELDS) {
      if (body[f] !== undefined) allowedData[f] = body[f];
    }
    const data: Prisma.FDPUpdateInput = { ...allowedData };
    if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate   !== undefined) data.endDate   = body.endDate   ? new Date(body.endDate)   : null;

    const result = await safeUpdate(prisma.fDP, id, data, "FDP");
    if (!result.success) return result.response;

    return updatedResponse(result.data, "FDP updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
