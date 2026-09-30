import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withRole } from "@/lib/api/middleware";
import { CopyrightStatus, TeacherStatus, Prisma } from "@prisma/client";
import { safeFetchWithOwnership, safeUpdate, safeDelete, isAuthorOf } from "@/lib/api/security";
import { pickAllowedFields, COPYRIGHT_FACULTY_FIELDS } from "@/lib/auth/field-allowlists";
import { successResponse, updatedResponse, deletedResponse, forbiddenResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/error-handler";

const authorInclude = {
  studentAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
  facultyAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
  grantMappings:  { include: { grantIn: { select: { id: true, projectCode: true, grantInStatus: true } } } },
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const { id } = await params;

      const result = await safeFetchWithOwnership(prisma.copyright, id, user, {
        resourceName: "Copyright",
        include: { studentAuthors: true, facultyAuthors: true },
        ownershipCheck: (r, u) => isAuthorOf(r, u.id),
        bypassRoles: ["EDITOR", "ADMIN", "SUPERADMIN"],
      });
      if (!result.success) return result.response;

      const copyright = await prisma.copyright.findUnique({ where: { id }, include: authorInclude });
      return successResponse(copyright);
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const { id } = await params;

      const fetchResult = await safeFetchWithOwnership(prisma.copyright, id, user, {
        resourceName: "Copyright",
        include: { studentAuthors: true, facultyAuthors: true },
        ownershipCheck: (r, u) => isAuthorOf(r, u.id),
        bypassRoles: [],
      });
      if (!fetchResult.success) return fetchResult.response;

      const existing = fetchResult.data;

      const canEdit = existing.copyrightStatus === CopyrightStatus.SUBMITTED
        || existing.teacherStatus === TeacherStatus.UPDATE;
      if (!canEdit) return forbiddenResponse("Cannot update copyright in its current state");

      const body = await req.json();
      const allowedData = pickAllowedFields(body, COPYRIGHT_FACULTY_FIELDS);
      const data: Prisma.CopyrightUpdateInput = { ...allowedData };
      for (const df of ["dateOfFiling", "dateOfSubmission", "dateOfPublished", "dateOfGrant"] as const) {
        if (body[df] !== undefined) data[df] = body[df] ? new Date(body[df]) : null;
      }
      if (existing.teacherStatus === TeacherStatus.UPDATE) {
        data.teacherStatus = TeacherStatus.UPLOADED;
      }

      const updateResult = await safeUpdate(prisma.copyright, id, data, "Copyright");
      if (!updateResult.success) return updateResult.response;

      const copyright = await prisma.copyright.findUnique({ where: { id }, include: authorInclude });
      return updatedResponse(copyright, "Copyright updated successfully");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const { id } = await params;

      const fetchResult = await safeFetchWithOwnership(prisma.copyright, id, user, {
        resourceName: "Copyright",
        include: { studentAuthors: true, facultyAuthors: true },
        ownershipCheck: (r, u) => isAuthorOf(r, u.id),
        bypassRoles: [],
      });
      if (!fetchResult.success) return fetchResult.response;

      if (fetchResult.data.copyrightStatus !== CopyrightStatus.SUBMITTED) {
        return forbiddenResponse("Cannot delete copyright after it has been reviewed");
      }

      const deleteResult = await safeDelete(prisma.copyright, id, "Copyright");
      if (!deleteResult.success) return deleteResult.response;

      return deletedResponse("Copyright deleted successfully");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}
