import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  withRole,
  successResponse,
  updatedResponse,
  deletedResponse,
  notFoundResponse,
  forbiddenResponse,
  handleApiError,
  updateCopyrightSchema,
  userBasicSelect,
  isUserAuthor,
} from "@/lib/api";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const isAuthor = await isUserAuthor("copyright", params.id, user.id);
      if (!isAuthor) return forbiddenResponse("You can only view your own copyrights");

      const copyright = await prisma.copyright.findUnique({
        where: { id: params.id },
        include: {
          studentAuthors: { include: { user: { select: userBasicSelect } } },
          facultyAuthors: { include: { user: { select: userBasicSelect } } },
          grantMappings: { include: { grantIn: { select: { id: true, projectCode: true, grantInStatus: true } } } },
        },
      });
      if (!copyright) return notFoundResponse("Copyright");
      return successResponse(copyright);
    } catch (error) { return handleApiError(error); }
  })(req);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const isAuthor = await isUserAuthor("copyright", params.id, user.id);
      if (!isAuthor) return forbiddenResponse("You can only update your own copyrights");

      const existing = await prisma.copyright.findUnique({
        where: { id: params.id },
        select: { copyrightStatus: true, teacherStatus: true },
      });
      if (!existing) return notFoundResponse("Copyright");

      const canEdit = existing.copyrightStatus === "SUBMITTED" || existing.teacherStatus === "UPDATE";
      if (!canEdit) return forbiddenResponse("Cannot update copyright in its current state");

      const body = await req.json();
      const validated = updateCopyrightSchema.parse(body);

      const copyright = await prisma.copyright.update({
        where: { id: params.id },
        data: {
          ...(validated.regNo && { regNo: validated.regNo }),
          ...(validated.title && { title: validated.title }),
          ...(validated.abstract !== undefined && { abstract: validated.abstract }),
          ...(validated.dateOfFiling && { dateOfFiling: new Date(validated.dateOfFiling) }),
          ...(validated.dateOfSubmission && { dateOfSubmission: new Date(validated.dateOfSubmission) }),
          ...(validated.dateOfPublished && { dateOfPublished: new Date(validated.dateOfPublished) }),
          ...(validated.dateOfGrant && { dateOfGrant: new Date(validated.dateOfGrant) }),
          ...(validated.registrationFees !== undefined && { registrationFees: validated.registrationFees }),
          ...(validated.reimbursement !== undefined && { reimbursement: validated.reimbursement }),
          ...(validated.imageUrl !== undefined && { imageUrl: validated.imageUrl }),
          ...(validated.documentUrl !== undefined && { documentUrl: validated.documentUrl }),
          ...(existing.teacherStatus === "UPDATE" && { teacherStatus: "UPLOADED" }),
        },
        include: {
          studentAuthors: { include: { user: { select: userBasicSelect } } },
          facultyAuthors: { include: { user: { select: userBasicSelect } } },
        },
      });

      return updatedResponse(copyright, "Copyright updated successfully");
    } catch (error) { return handleApiError(error); }
  })(req);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const isAuthor = await isUserAuthor("copyright", params.id, user.id);
      if (!isAuthor) return forbiddenResponse("You can only delete your own copyrights");

      const existing = await prisma.copyright.findUnique({
        where: { id: params.id },
        select: { copyrightStatus: true },
      });
      if (!existing) return notFoundResponse("Copyright");
      if (existing.copyrightStatus !== "SUBMITTED") return forbiddenResponse("Cannot delete copyright after review");

      await prisma.copyright.delete({ where: { id: params.id } });
      return deletedResponse("Copyright deleted successfully");
    } catch (error) { return handleApiError(error); }
  })(req);
}
