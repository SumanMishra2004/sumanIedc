import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api/middleware";
import { AchievementStatus, Prisma } from "@prisma/client";
import { safeFetchWithOwnership, safeUpdate, safeDelete, isResourceOwner } from "@/lib/api/security";
import { pickAllowedFields, ACHIEVEMENT_OWNER_FIELDS } from "@/lib/auth/field-allowlists";
import { successResponse, updatedResponse, deletedResponse, forbiddenResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/error-handler";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(async ({ user }) => {
    try {
      const { id } = await params;

      // safeFetchWithOwnership returns 404 for both "not found" AND "not owned"
      // preventing IDOR resource-existence leakage
      const result = await safeFetchWithOwnership(prisma.achievement, id, user, {
        resourceName: "Achievement",
        ownershipCheck: (r, u) => isResourceOwner(r, u.id),
        bypassRoles: ["EDITOR", "ADMIN", "SUPERADMIN"],
      });
      if (!result.success) return result.response;

      return successResponse(result.data);
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(async ({ user }) => {
    try {
      const { id } = await params;

      // Ownership check — returns 404 for unknown IDs (no existence leak)
      const fetchResult = await safeFetchWithOwnership(prisma.achievement, id, user, {
        resourceName: "Achievement",
        ownershipCheck: (r, u) => isResourceOwner(r, u.id),
        bypassRoles: [],
      });
      if (!fetchResult.success) return fetchResult.response;

      const existing = fetchResult.data;

      if (existing.achievementStatus !== AchievementStatus.SUBMITTED) {
        return forbiddenResponse("Cannot update achievement after it has been reviewed");
      }

      const body = await req.json();
      const allowedData = pickAllowedFields(body, ACHIEVEMENT_OWNER_FIELDS);
      const data: Prisma.AchievementUpdateInput = { ...allowedData };

      // safeUpdate handles "record disappeared between fetch and update" atomically
      const updateResult = await safeUpdate(prisma.achievement, id, data, "Achievement");
      if (!updateResult.success) return updateResult.response;

      return updatedResponse(updateResult.data, "Achievement updated successfully");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(async ({ user }) => {
    try {
      const { id } = await params;

      const fetchResult = await safeFetchWithOwnership(prisma.achievement, id, user, {
        resourceName: "Achievement",
        ownershipCheck: (r, u) => isResourceOwner(r, u.id),
        bypassRoles: [],
      });
      if (!fetchResult.success) return fetchResult.response;

      const existing = fetchResult.data;

      // Allow delete only on SUBMITTED or REJECTED
      if (![AchievementStatus.SUBMITTED, AchievementStatus.REJECTED].includes(existing.achievementStatus as AchievementStatus)) {
        return forbiddenResponse("Cannot delete an approved achievement");
      }

      const deleteResult = await safeDelete(prisma.achievement, id, "Achievement");
      if (!deleteResult.success) return deleteResult.response;

      return deletedResponse("Achievement deleted successfully");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}
