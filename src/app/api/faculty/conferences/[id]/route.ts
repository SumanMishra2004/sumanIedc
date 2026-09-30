import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withRole } from "@/lib/api/middleware";
import { ConferenceStatus, TeacherStatus, Prisma } from "@prisma/client";
import { safeFetchWithOwnership, safeUpdate, safeDelete, isAuthorOf } from "@/lib/api/security";
import { pickAllowedFields, CONFERENCE_FACULTY_FIELDS } from "@/lib/auth/field-allowlists";
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

      const result = await safeFetchWithOwnership(prisma.conference, id, user, {
        resourceName: "Conference",
        include: { studentAuthors: true, facultyAuthors: true },
        ownershipCheck: (r, u) => isAuthorOf(r, u.id),
        bypassRoles: ["EDITOR", "ADMIN", "SUPERADMIN"],
      });
      if (!result.success) return result.response;

      const conf = await prisma.conference.findUnique({ where: { id }, include: authorInclude });
      return successResponse(conf);
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const { id } = await params;

      const fetchResult = await safeFetchWithOwnership(prisma.conference, id, user, {
        resourceName: "Conference",
        include: { studentAuthors: true, facultyAuthors: true },
        ownershipCheck: (r, u) => isAuthorOf(r, u.id),
        bypassRoles: [],
      });
      if (!fetchResult.success) return fetchResult.response;

      const existing = fetchResult.data;

      const canEdit = existing.conferenceStatus === ConferenceStatus.SUBMITTED
        || existing.teacherStatus === TeacherStatus.UPDATE;
      if (!canEdit) return forbiddenResponse("Cannot update conference in its current state");

      const body = await req.json();
      const allowedData = pickAllowedFields(body, CONFERENCE_FACULTY_FIELDS);
      const data: Prisma.ConferenceUpdateInput = { ...allowedData };
      if (body.conferenceDate !== undefined) data.conferenceDate = body.conferenceDate ? new Date(body.conferenceDate) : null;
      if (body.statusDate     !== undefined) data.statusDate     = body.statusDate     ? new Date(body.statusDate)     : null;
      if (existing.teacherStatus === TeacherStatus.UPDATE) {
        data.teacherStatus = TeacherStatus.UPLOADED;
      }

      const updateResult = await safeUpdate(prisma.conference, id, data, "Conference");
      if (!updateResult.success) return updateResult.response;

      const conf = await prisma.conference.findUnique({ where: { id }, include: authorInclude });
      return updatedResponse(conf, "Conference updated successfully");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const { id } = await params;

      const fetchResult = await safeFetchWithOwnership(prisma.conference, id, user, {
        resourceName: "Conference",
        include: { studentAuthors: true, facultyAuthors: true },
        ownershipCheck: (r, u) => isAuthorOf(r, u.id),
        bypassRoles: [],
      });
      if (!fetchResult.success) return fetchResult.response;

      if (fetchResult.data.conferenceStatus !== ConferenceStatus.SUBMITTED) {
        return forbiddenResponse("Cannot delete conference after it has been reviewed");
      }

      const deleteResult = await safeDelete(prisma.conference, id, "Conference");
      if (!deleteResult.success) return deleteResult.response;

      return deletedResponse("Conference deleted successfully");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}
