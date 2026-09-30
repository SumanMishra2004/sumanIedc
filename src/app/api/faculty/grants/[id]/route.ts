import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withRole } from "@/lib/api/middleware";
import { GrantInStatus, Prisma } from "@prisma/client";
import { safeFetchWithOwnership, safeUpdate, safeDelete, isAuthorOf } from "@/lib/api/security";
import { pickAllowedFields, GRANT_FACULTY_FIELDS } from "@/lib/auth/field-allowlists";
import { successResponse, updatedResponse, deletedResponse, forbiddenResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/error-handler";

const grantInclude = {
  studentAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
  facultyAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
  bills: {
    select: {
      id: true, fileId: true, fileUrl: true, billType: true, customBillType: true,
      isMasterPdf: true, billStatus: true, billDate: true, amount: true, createdAt: true,
      user: { select: { id: true, name: true } },
    },
    orderBy: { billDate: "desc" as const },
  },
  publicationMappings: {
    include: {
      journal:     { select: { id: true, title: true } },
      conference:  { select: { id: true, conferenceName: true } },
      bookChapter: { select: { id: true, title: true } },
      patent:      { select: { id: true, title: true } },
      copyright:   { select: { id: true, title: true } },
    },
  },
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const { id } = await params;

      // Returns 404 for both "not found" and "not authorized" — prevents IDOR
      const result = await safeFetchWithOwnership(prisma.grantIn, id, user, {
        resourceName: "Grant",
        include: { studentAuthors: true, facultyAuthors: true },
        ownershipCheck: (r, u) => isAuthorOf(r, u.id),
        bypassRoles: ["EDITOR", "ADMIN", "SUPERADMIN"],
      });
      if (!result.success) return result.response;

      const grant = await prisma.grantIn.findUnique({ where: { id }, include: grantInclude });
      return successResponse(grant);
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const { id } = await params;

      const fetchResult = await safeFetchWithOwnership(prisma.grantIn, id, user, {
        resourceName: "Grant",
        include: { studentAuthors: true, facultyAuthors: true },
        ownershipCheck: (r, u) => isAuthorOf(r, u.id),
        bypassRoles: [],
      });
      if (!fetchResult.success) return fetchResult.response;

      const existing = fetchResult.data;

      if ([GrantInStatus.COMPLETED, GrantInStatus.REJECTED].includes(existing.grantInStatus)) {
        return forbiddenResponse("Cannot update a completed or rejected grant");
      }

      const body = await req.json();

      // Faculty only allowed to update non-financial, non-status fields
      const allowedData = pickAllowedFields(body, GRANT_FACULTY_FIELDS);
      const data: Prisma.GrantInUpdateInput = { ...allowedData };
      if (body.applicationDate !== undefined) data.applicationDate = body.applicationDate ? new Date(body.applicationDate) : null;
      if (body.grantDate       !== undefined) data.grantDate       = body.grantDate       ? new Date(body.grantDate)       : null;

      const updateResult = await safeUpdate(prisma.grantIn, id, data, "Grant");
      if (!updateResult.success) return updateResult.response;

      return updatedResponse(updateResult.data, "Grant updated successfully");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const { id } = await params;

      const fetchResult = await safeFetchWithOwnership(prisma.grantIn, id, user, {
        resourceName: "Grant",
        include: { studentAuthors: true, facultyAuthors: true },
        ownershipCheck: (r, u) => isAuthorOf(r, u.id),
        bypassRoles: [],
      });
      if (!fetchResult.success) return fetchResult.response;

      // Only APPLIED grants can be deleted
      if (fetchResult.data.grantInStatus !== GrantInStatus.APPLIED) {
        return forbiddenResponse("Cannot delete grant after it has been processed");
      }

      const deleteResult = await safeDelete(prisma.grantIn, id, "Grant");
      if (!deleteResult.success) return deleteResult.response;

      return deletedResponse("Grant deleted successfully");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}
