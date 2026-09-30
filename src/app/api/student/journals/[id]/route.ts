import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api/middleware";
import { JournalStatus, Prisma } from "@prisma/client";
import { safeFetchWithOwnership, safeUpdate, safeDelete, isAuthorOf } from "@/lib/api/security";
import { pickAllowedFields, JOURNAL_STUDENT_FIELDS } from "@/lib/auth/field-allowlists";
import { successResponse, updatedResponse, deletedResponse, forbiddenResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/error-handler";

const authorInclude = {
  studentAuthors: { include: { user: { select: { id: true, name: true, email: true } } } },
  facultyAuthors: { include: { user: { select: { id: true, name: true, email: true } } } },
  grantMappings:  { include: { grantIn: { select: { id: true, projectCode: true, grantInStatus: true, amountGranted: true } } } },
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(async ({ user }) => {
    try {
      const { id } = await params;

      const result = await safeFetchWithOwnership(prisma.journal, id, user, {
        resourceName: "Journal",
        include: { studentAuthors: true, facultyAuthors: true },
        ownershipCheck: (r, u) => isAuthorOf(r, u.id),
        bypassRoles: ["EDITOR", "ADMIN", "SUPERADMIN"],
      });
      if (!result.success) return result.response;

      const journal = await prisma.journal.findUnique({ where: { id }, include: authorInclude });
      return successResponse(journal);
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(async ({ user }) => {
    try {
      const { id } = await params;

      const fetchResult = await safeFetchWithOwnership(prisma.journal, id, user, {
        resourceName: "Journal",
        include: { studentAuthors: true, facultyAuthors: true },
        ownershipCheck: (r, u) => isAuthorOf(r, u.id),
        bypassRoles: [],
      });
      if (!fetchResult.success) return fetchResult.response;

      const existing = fetchResult.data;

      if (existing.journalStatus !== JournalStatus.SUBMITTED) {
        return forbiddenResponse("Cannot update journal after it has been reviewed");
      }

      const body = await req.json();
      const allowedData = pickAllowedFields(body, JOURNAL_STUDENT_FIELDS);
      const data: Prisma.JournalUpdateInput = { ...allowedData };
      if (body.publicationDate  !== undefined) data.publicationDate  = body.publicationDate  ? new Date(body.publicationDate)  : null;
      if (body.impactFactorDate !== undefined) data.impactFactorDate = body.impactFactorDate ? new Date(body.impactFactorDate) : null;

      const updateResult = await safeUpdate(prisma.journal, id, data, "Journal");
      if (!updateResult.success) return updateResult.response;

      return updatedResponse(updateResult.data, "Journal updated successfully");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(async ({ user }) => {
    try {
      const { id } = await params;

      const fetchResult = await safeFetchWithOwnership(prisma.journal, id, user, {
        resourceName: "Journal",
        include: { studentAuthors: true, facultyAuthors: true },
        ownershipCheck: (r, u) => isAuthorOf(r, u.id),
        bypassRoles: [],
      });
      if (!fetchResult.success) return fetchResult.response;

      if (fetchResult.data.journalStatus !== JournalStatus.SUBMITTED) {
        return forbiddenResponse("Cannot delete journal after it has been reviewed");
      }

      const deleteResult = await safeDelete(prisma.journal, id, "Journal");
      if (!deleteResult.success) return deleteResult.response;

      return deletedResponse("Journal deleted successfully");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}
