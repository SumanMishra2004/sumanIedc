import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/auth/guard";
import { AchievementStatus, Prisma } from "@prisma/client";
import { safeUpdate } from "@/lib/api/security";
import { pickAllowedFields, ACHIEVEMENT_EDITOR_FIELDS } from "@/lib/auth/field-allowlists";
import { successResponse, updatedResponse, notFoundResponse, badRequestResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/error-handler";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const achievement = await prisma.achievement.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true, department: true, role: true } } },
    });

    if (!achievement) return notFoundResponse("Achievement");
    return successResponse(achievement);
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

    if (body.achievementStatus && !Object.values(AchievementStatus).includes(body.achievementStatus)) {
      return badRequestResponse("Invalid achievementStatus");
    }

    const allowedData = pickAllowedFields(body, ACHIEVEMENT_EDITOR_FIELDS);
    const data: Prisma.AchievementUpdateInput = { ...allowedData };

    const result = await safeUpdate(prisma.achievement, id, data, "Achievement");
    if (!result.success) return result.response;

    return updatedResponse(result.data, "Achievement updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
