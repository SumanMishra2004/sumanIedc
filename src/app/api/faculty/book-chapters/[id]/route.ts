import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withRole } from "@/lib/api/middleware";
import { BookchapterStatus, TeacherStatus, Prisma } from "@prisma/client";
import { safeFetchWithOwnership, safeUpdate, safeDelete, isAuthorOf } from "@/lib/api/security";
import { pickAllowedFields, BOOK_CHAPTER_FACULTY_FIELDS } from "@/lib/auth/field-allowlists";
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

      const result = await safeFetchWithOwnership(prisma.bookChapter, id, user, {
        resourceName: "Book chapter",
        include: { studentAuthors: true, facultyAuthors: true },
        ownershipCheck: (r, u) => isAuthorOf(r, u.id),
        bypassRoles: ["EDITOR", "ADMIN", "SUPERADMIN"],
      });
      if (!result.success) return result.response;

      const bc = await prisma.bookChapter.findUnique({ where: { id }, include: authorInclude });
      return successResponse(bc);
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const { id } = await params;

      const fetchResult = await safeFetchWithOwnership(prisma.bookChapter, id, user, {
        resourceName: "Book chapter",
        include: { studentAuthors: true, facultyAuthors: true },
        ownershipCheck: (r, u) => isAuthorOf(r, u.id),
        bypassRoles: [],
      });
      if (!fetchResult.success) return fetchResult.response;

      const existing = fetchResult.data;

      const canEdit = existing.bookChapterStatus === BookchapterStatus.SUBMITTED
        || existing.teacherStatus === TeacherStatus.UPDATE;
      if (!canEdit) return forbiddenResponse("Cannot update book chapter in its current state");

      const body = await req.json();
      const allowedData = pickAllowedFields(body, BOOK_CHAPTER_FACULTY_FIELDS);
      const data: Prisma.BookChapterUpdateInput = { ...allowedData };
      if (body.publicationDate !== undefined) {
        data.publicationDate = body.publicationDate ? new Date(body.publicationDate) : null;
      }
      if (existing.teacherStatus === TeacherStatus.UPDATE) {
        data.teacherStatus = TeacherStatus.UPLOADED;
      }

      const updateResult = await safeUpdate(prisma.bookChapter, id, data, "Book chapter");
      if (!updateResult.success) return updateResult.response;

      const bc = await prisma.bookChapter.findUnique({ where: { id }, include: authorInclude });
      return updatedResponse(bc, "Book chapter updated successfully");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const { id } = await params;

      const fetchResult = await safeFetchWithOwnership(prisma.bookChapter, id, user, {
        resourceName: "Book chapter",
        include: { studentAuthors: true, facultyAuthors: true },
        ownershipCheck: (r, u) => isAuthorOf(r, u.id),
        bypassRoles: [],
      });
      if (!fetchResult.success) return fetchResult.response;

      if (fetchResult.data.bookChapterStatus !== BookchapterStatus.SUBMITTED) {
        return forbiddenResponse("Cannot delete book chapter after it has been reviewed");
      }

      const deleteResult = await safeDelete(prisma.bookChapter, id, "Book chapter");
      if (!deleteResult.success) return deleteResult.response;

      return deletedResponse("Book chapter deleted successfully");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}
