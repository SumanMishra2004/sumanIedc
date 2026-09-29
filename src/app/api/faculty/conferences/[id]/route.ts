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
  updateConferenceSchema,
  userBasicSelect,
  isUserAuthor,
} from "@/lib/api";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const isAuthor = await isUserAuthor("conference", params.id, user.id);
      if (!isAuthor) return forbiddenResponse("You can only view your own conferences");

      const conference = await prisma.conference.findUnique({
        where: { id: params.id },
        include: {
          studentAuthors: { include: { user: { select: userBasicSelect } } },
          facultyAuthors: { include: { user: { select: userBasicSelect } } },
          grantMappings: { include: { grantIn: { select: { id: true, projectCode: true, grantInStatus: true } } } },
        },
      });
      if (!conference) return notFoundResponse("Conference");
      return successResponse(conference);
    } catch (error) { return handleApiError(error); }
  })(req);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const isAuthor = await isUserAuthor("conference", params.id, user.id);
      if (!isAuthor) return forbiddenResponse("You can only update your own conferences");

      const existing = await prisma.conference.findUnique({
        where: { id: params.id },
        select: { conferenceStatus: true, teacherStatus: true },
      });
      if (!existing) return notFoundResponse("Conference");

      const canEdit = existing.conferenceStatus === "SUBMITTED" || existing.teacherStatus === "UPDATE";
      if (!canEdit) return forbiddenResponse("Cannot update conference in its current state");

      const body = await req.json();
      const validated = updateConferenceSchema.parse(body);

      const conference = await prisma.conference.update({
        where: { id: params.id },
        data: {
          ...(validated.conferenceName && { conferenceName: validated.conferenceName }),
          ...(validated.mode && { mode: validated.mode }),
          ...(validated.abstract !== undefined && { abstract: validated.abstract }),
          ...(validated.keywords && { keywords: validated.keywords }),
          ...(validated.conferencePublisher !== undefined && { conferencePublisher: validated.conferencePublisher }),
          ...(validated.conferenceDate && { conferenceDate: new Date(validated.conferenceDate) }),
          ...(validated.paperDoi !== undefined && { paperDoi: validated.paperDoi }),
          ...(validated.paperLink !== undefined && { paperLink: validated.paperLink }),
          ...(validated.paperName !== undefined && { paperName: validated.paperName }),
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

      return updatedResponse(conference, "Conference updated successfully");
    } catch (error) { return handleApiError(error); }
  })(req);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const isAuthor = await isUserAuthor("conference", params.id, user.id);
      if (!isAuthor) return forbiddenResponse("You can only delete your own conferences");

      const existing = await prisma.conference.findUnique({
        where: { id: params.id },
        select: { conferenceStatus: true },
      });
      if (!existing) return notFoundResponse("Conference");
      if (existing.conferenceStatus !== "SUBMITTED") return forbiddenResponse("Cannot delete conference after review");

      await prisma.conference.delete({ where: { id: params.id } });
      return deletedResponse("Conference deleted successfully");
    } catch (error) { return handleApiError(error); }
  })(req);
}
