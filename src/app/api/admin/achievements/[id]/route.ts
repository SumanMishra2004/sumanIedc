import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { AchievementStatus, Prisma } from "@prisma/client";
import { safeUpdate, safeDelete } from "@/lib/api/security";
import { pickAllowedFields, ACHIEVEMENT_ADMIN_FIELDS } from "@/lib/auth/field-allowlists";
import { successResponse, updatedResponse, deletedResponse, notFoundResponse, badRequestResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/error-handler";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  
  try {
    const { id } = await params;
    
    const resource = await prisma.achievement.findUnique({
      where: { id },
    });
    
    if (!resource) {
      return notFoundResponse("Achievement");
    }
    
    return successResponse(resource);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  
  try {
    const { id } = await params;
    const body = await req.json();
    
    // Validate status enums if provided
    if (body.achievementStatus && !Object.values(AchievementStatus).includes(body.achievementStatus)) {
      return badRequestResponse("Invalid achievementStatus");
    }

    // Use field allowlist to prevent mass assignment
    const allowedData = pickAllowedFields(body, ACHIEVEMENT_ADMIN_FIELDS);
    
    // Prepare update data with proper type conversions
    const data: Prisma.AchievementUpdateInput = {
      ...allowedData,
    };

    // Use safe update to prevent race conditions
    const result = await safeUpdate(
      prisma.achievement,
      id,
      data,
      "Achievement"
    );
    
    if (!result.success) {
      return result.response;
    }
    
    return updatedResponse(result.data, "Achievement updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  
  try {
    const { id } = await params;
    
    // Use safe delete to prevent race conditions
    const result = await safeDelete(prisma.achievement, id, "Achievement");
    
    if (!result.success) {
      return result.response;
    }
    
    return deletedResponse("Achievement deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
