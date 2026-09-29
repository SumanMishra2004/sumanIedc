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
  updatePatentSchema,
  userBasicSelect,
  isUserAuthor,
} from "@/lib/api";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const isAuthor = await isUserAuthor("patent", params.id, user.id);
      if (!isAuthor) return forbiddenResponse("You can only view your own patents");

      const patent = await prisma.patent.findUnique({
        where: { id: params.id },
        include: {
          studentAuthors: { include: { user: { select: userBasicSelect } } },
          facultyAuthors: { include: { user: { select: userBasicSelect } } },
          grantMappings: { include: { grantIn: { select: { id: true, projectCode: true, grantInStatus: true } } } },
        },
      });
      if (!patent) return notFoundResponse("Patent");
      return successResponse(patent);
    } catch (error) { return handleApiError(error); }
  })(req);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const isAuthor = await isUserAuthor("patent", params.id, user.id);
      if (!isAuthor) return forbiddenResponse("You can only update your own patents");

      const existing = await prisma.patent.findUnique({
        where: { id: params.id },
        select: { patentStatus: true, teacherStatus: true },
      });
      if (!existing) return notFoundResponse("Patent");

      const canEdit = existing.patentStatus === "SUBMITTED" || existing.teacherStatus === "UPDATE";
      if (!canEdit) return forbiddenResponse("Cannot update patent in its current state");

      const body = await req.json();
      const validated = updatePatentSchema.parse(body);

      const patent = await prisma.patent.update({
        where: { id: params.id },
        data: {
          ...(validated.title && { title: validated.title }),
          ...(validated.keywords && { keywords: validated.keywords }),
          ...(validated.abstract !== undefined && { abstract: validated.abstract }),
          ...(validated.applicationNo !== undefined && { applicationNo: validated.applicationNo }),
          ...(validated.grantedPatentNo !== undefined && { grantedPatentNo: validated.grantedPatentNo }),
          ...(validated.filingDate && { filingDate: new Date(validated.filingDate) }),
          ...(validated.submissionDate && { submissionDate: new Date(validated.submissionDate) }),
          ...(validated.publicationDate && { publicationDate: new Date(validated.publicationDate) }),
          ...(validated.grantDate && { grantDate: new Date(validated.grantDate) }),
          ...(validated.patentLink !== undefined && { patentLink: validated.patentLink }),
          ...(validated.imageUrl !== undefined && { imageUrl: validated.imageUrl }),
          ...(validated.documentUrl !== undefined && { documentUrl: validated.documentUrl }),
          ...(existing.teacherStatus === "UPDATE" && { teacherStatus: "UPLOADED" }),
        },
        include: {
          studentAuthors: { include: { user: { select: userBasicSelect } } },
          facultyAuthors: { include: { user: { select: userBasicSelect } } },
        },
      });

      return updatedResponse(patent, "Patent updated successfully");
    } catch (error) { return handleApiError(error); }
  })(req);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const isAuthor = await isUserAuthor("patent", params.id, user.id);
      if (!isAuthor) return forbiddenResponse("You can only delete your own patents");

      const existing = await prisma.patent.findUnique({
        where: { id: params.id },
        select: { patentStatus: true },
      });
      if (!existing) return notFoundResponse("Patent");
      if (existing.patentStatus !== "SUBMITTED") return forbiddenResponse("Cannot delete patent after review");

      await prisma.patent.delete({ where: { id: params.id } });
      return deletedResponse("Patent deleted successfully");
    } catch (error) { return handleApiError(error); }
  })(req);
}
