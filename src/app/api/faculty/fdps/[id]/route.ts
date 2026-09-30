import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withRole } from "@/lib/api/middleware";
import { FDPStatus, Prisma } from "@prisma/client";
import { safeFetchWithOwnership, safeUpdate, safeDelete, isResourceOwner } from "@/lib/api/security";
import { successResponse, updatedResponse, deletedResponse, forbiddenResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/error-handler";

// FDP fields a faculty member may update before review
const FDP_FACULTY_FIELDS = [
  "title", "description", "keywords", "organizedBy",
  "topic", "duration", "remark",
] as const;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const { id } = await params;

      // Returns 404 for both "not found" and "not owned" — prevents IDOR
      const result = await safeFetchWithOwnership(prisma.fDP, id, user, {
        resourceName: "FDP",
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
  return withRole("FACULTY", async ({ user }) => {
    try {
      const { id } = await params;

      const fetchResult = await safeFetchWithOwnership(prisma.fDP, id, user, {
        resourceName: "FDP",
        ownershipCheck: (r, u) => isResourceOwner(r, u.id),
        bypassRoles: [],
      });
      if (!fetchResult.success) return fetchResult.response;

      if (fetchResult.data.fdpStatus !== FDPStatus.SUBMITTED) {
        return forbiddenResponse("Cannot update FDP after it has been reviewed");
      }

      const body = await req.json();
      const data: Prisma.FDPUpdateInput = {};
      for (const f of FDP_FACULTY_FIELDS) {
        if (body[f] !== undefined) (data as Record<string, unknown>)[f] = body[f];
      }
      if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null;
      if (body.endDate   !== undefined) data.endDate   = body.endDate   ? new Date(body.endDate)   : null;

      const updateResult = await safeUpdate(prisma.fDP, id, data, "FDP");
      if (!updateResult.success) return updateResult.response;

      return updatedResponse(updateResult.data, "FDP updated successfully");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const { id } = await params;

      const fetchResult = await safeFetchWithOwnership(prisma.fDP, id, user, {
        resourceName: "FDP",
        ownershipCheck: (r, u) => isResourceOwner(r, u.id),
        bypassRoles: [],
      });
      if (!fetchResult.success) return fetchResult.response;

      if (fetchResult.data.fdpStatus !== FDPStatus.SUBMITTED) {
        return forbiddenResponse("Cannot delete FDP after it has been reviewed");
      }

      const deleteResult = await safeDelete(prisma.fDP, id, "FDP");
      if (!deleteResult.success) return deleteResult.response;

      return deletedResponse("FDP deleted successfully");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}
