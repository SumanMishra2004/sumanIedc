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
  updateJournalSchema,
  userBasicSelect,
  isUserAuthor,
} from "@/lib/api";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const isAuthor = await isUserAuthor("journal", params.id, user.id);
      if (!isAuthor) return forbiddenResponse("You can only view your own journals");

      const journal = await prisma.journal.findUnique({
        where: { id: params.id },
        include: {
          studentAuthors: { include: { user: { select: userBasicSelect } } },
          facultyAuthors: { include: { user: { select: userBasicSelect } } },
          grantMappings: {
            include: {
              grantIn: { select: { id: true, projectCode: true, grantInStatus: true, amountGranted: true } },
            },
          },
        },
      });

      if (!journal) return notFoundResponse("Journal");
      return successResponse(journal);
    } catch (error) { return handleApiError(error); }
  })(req);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const isAuthor = await isUserAuthor("journal", params.id, user.id);
      if (!isAuthor) return forbiddenResponse("You can only update your own journals");

      const existing = await prisma.journal.findUnique({
        where: { id: params.id },
        select: { journalStatus: true, teacherStatus: true },
      });
      if (!existing) return notFoundResponse("Journal");

      // Faculty can also update when teacherStatus is UPDATE (requested by admin)
      const canEdit =
        existing.journalStatus === "SUBMITTED" ||
        existing.teacherStatus === "UPDATE";
      if (!canEdit) return forbiddenResponse("Cannot update journal in its current state");

      const body = await req.json();
      const validated = updateJournalSchema.parse(body);

      const journal = await prisma.journal.update({
        where: { id: params.id },
        data: {
          ...(validated.title && { title: validated.title }),
          ...(validated.journalName && { journalName: validated.journalName }),
          ...(validated.abstract !== undefined && { abstract: validated.abstract }),
          ...(validated.scope && { scope: validated.scope }),
          ...(validated.reviewType && { reviewType: validated.reviewType }),
          ...(validated.accessType && { accessType: validated.accessType }),
          ...(validated.indexing && { indexing: validated.indexing }),
          ...(validated.quartile && { quartile: validated.quartile }),
          ...(validated.impactFactor !== undefined && { impactFactor: validated.impactFactor }),
          ...(validated.impactFactorDate && { impactFactorDate: new Date(validated.impactFactorDate) }),
          ...(validated.publisher !== undefined && { publisher: validated.publisher }),
          ...(validated.publicationMode && { publicationMode: validated.publicationMode }),
          ...(validated.publicationDate && { publicationDate: new Date(validated.publicationDate) }),
          ...(validated.doi !== undefined && { doi: validated.doi }),
          ...(validated.paperLink !== undefined && { paperLink: validated.paperLink }),
          ...(validated.keywords && { keywords: validated.keywords }),
          ...(validated.registrationFees !== undefined && { registrationFees: validated.registrationFees }),
          ...(validated.reimbursement !== undefined && { reimbursement: validated.reimbursement }),
          ...(validated.imageUrl !== undefined && { imageUrl: validated.imageUrl }),
          ...(validated.documentUrl !== undefined && { documentUrl: validated.documentUrl }),
          // Reset back to UPLOADED if it was UPDATE
          ...(existing.teacherStatus === "UPDATE" && { teacherStatus: "UPLOADED" }),
        },
        include: {
          studentAuthors: { include: { user: { select: userBasicSelect } } },
          facultyAuthors: { include: { user: { select: userBasicSelect } } },
        },
      });

      return updatedResponse(journal, "Journal updated successfully");
    } catch (error) { return handleApiError(error); }
  })(req);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const isAuthor = await isUserAuthor("journal", params.id, user.id);
      if (!isAuthor) return forbiddenResponse("You can only delete your own journals");

      const existing = await prisma.journal.findUnique({
        where: { id: params.id },
        select: { journalStatus: true },
      });
      if (!existing) return notFoundResponse("Journal");

      if (existing.journalStatus !== "SUBMITTED") {
        return forbiddenResponse("Cannot delete journal after it has been reviewed");
      }

      await prisma.journal.delete({ where: { id: params.id } });
      return deletedResponse("Journal deleted successfully");
    } catch (error) { return handleApiError(error); }
  })(req);
}
