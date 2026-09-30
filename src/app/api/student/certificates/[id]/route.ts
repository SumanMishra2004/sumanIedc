import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api/middleware";
import { CertificateStatus, Prisma } from "@prisma/client";
import { safeFetchWithOwnership, safeUpdate, safeDelete, isResourceOwner } from "@/lib/api/security";
import { successResponse, updatedResponse, deletedResponse, forbiddenResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/error-handler";

// Certificate fields a student may update before review
const CERTIFICATE_STUDENT_FIELDS = [
  "title", "description", "keywords", "offeredBy", "documentUrl",
  "remark", "dateOfCompletion",
] as const;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(async ({ user }) => {
    try {
      const { id } = await params;

      const result = await safeFetchWithOwnership(prisma.certificate, id, user, {
        resourceName: "Certificate",
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

      const fetchResult = await safeFetchWithOwnership(prisma.certificate, id, user, {
        resourceName: "Certificate",
        ownershipCheck: (r, u) => isResourceOwner(r, u.id),
        bypassRoles: [],
      });
      if (!fetchResult.success) return fetchResult.response;

      if (fetchResult.data.certificateStatus !== CertificateStatus.SUBMITTED) {
        return forbiddenResponse("Cannot update certificate after it has been reviewed");
      }

      const body = await req.json();

      // Build update from allowlist
      const data: Prisma.CertificateUpdateInput = {};
      for (const f of CERTIFICATE_STUDENT_FIELDS) {
        if (f === "dateOfCompletion") continue; // handled separately
        if (body[f] !== undefined) (data as Record<string, unknown>)[f] = body[f];
      }
      if (body.dateOfCompletion !== undefined) {
        data.dateOfCompletion = body.dateOfCompletion ? new Date(body.dateOfCompletion) : undefined;
      }

      const updateResult = await safeUpdate(prisma.certificate, id, data, "Certificate");
      if (!updateResult.success) return updateResult.response;

      return updatedResponse(updateResult.data, "Certificate updated successfully");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(async ({ user }) => {
    try {
      const { id } = await params;

      const fetchResult = await safeFetchWithOwnership(prisma.certificate, id, user, {
        resourceName: "Certificate",
        ownershipCheck: (r, u) => isResourceOwner(r, u.id),
        bypassRoles: [],
      });
      if (!fetchResult.success) return fetchResult.response;

      if (fetchResult.data.certificateStatus !== CertificateStatus.SUBMITTED) {
        return forbiddenResponse("Cannot delete certificate after it has been reviewed");
      }

      const deleteResult = await safeDelete(prisma.certificate, id, "Certificate");
      if (!deleteResult.success) return deleteResult.response;

      return deletedResponse("Certificate deleted successfully");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}
