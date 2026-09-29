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
  updateGrantInSchema,
  userBasicSelect,
  isUserAuthor,
} from "@/lib/api";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const isAuthor = await isUserAuthor("grantIn", params.id, user.id);
      if (!isAuthor) return forbiddenResponse("You can only view your own grants");

      const grant = await prisma.grantIn.findUnique({
        where: { id: params.id },
        include: {
          studentAuthors: { include: { user: { select: userBasicSelect } } },
          facultyAuthors: { include: { user: { select: userBasicSelect } } },
          bills: {
            select: {
              id: true,
              fileId: true,
              fileUrl: true,
              billType: true,
              customBillType: true,
              isMasterPdf: true,
              billStatus: true,
              billDate: true,
              amount: true,
              createdAt: true,
              user: { select: { id: true, name: true } },
            },
            orderBy: { billDate: "desc" },
          },
          publicationMappings: {
            include: {
              journal: { select: { id: true, title: true } },
              conference: { select: { id: true, conferenceName: true } },
              bookChapter: { select: { id: true, title: true } },
              patent: { select: { id: true, title: true } },
              copyright: { select: { id: true, title: true } },
            },
          },
        },
      });

      if (!grant) return notFoundResponse("Grant");
      return successResponse(grant);
    } catch (error) { return handleApiError(error); }
  })(req);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const isAuthor = await isUserAuthor("grantIn", params.id, user.id);
      if (!isAuthor) return forbiddenResponse("You can only update your own grants");

      const existing = await prisma.grantIn.findUnique({
        where: { id: params.id },
        select: { grantInStatus: true },
      });
      if (!existing) return notFoundResponse("Grant");

      if (existing.grantInStatus === "COMPLETED" || existing.grantInStatus === "REJECTED") {
        return forbiddenResponse("Cannot update a completed or rejected grant");
      }

      const body = await req.json();
      const validated = updateGrantInSchema.parse(body);

      const grant = await prisma.grantIn.update({
        where: { id: params.id },
        data: {
          ...(validated.projectCode !== undefined && { projectCode: validated.projectCode }),
          ...(validated.applicationDate && { applicationDate: new Date(validated.applicationDate) }),
          ...(validated.grantDate && { grantDate: new Date(validated.grantDate) }),
          ...(validated.durationOfProject !== undefined && { durationOfProject: validated.durationOfProject }),
          ...(validated.amountGranted !== undefined && { amountGranted: validated.amountGranted }),
        },
      });

      return updatedResponse(grant, "Grant updated successfully");
    } catch (error) { return handleApiError(error); }
  })(req);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const isAuthor = await isUserAuthor("grantIn", params.id, user.id);
      if (!isAuthor) return forbiddenResponse("You can only delete your own grants");

      const existing = await prisma.grantIn.findUnique({
        where: { id: params.id },
        select: { grantInStatus: true },
      });
      if (!existing) return notFoundResponse("Grant");
      if (existing.grantInStatus !== "APPLIED") return forbiddenResponse("Cannot delete grant after it has been processed");

      await prisma.grantIn.delete({ where: { id: params.id } });
      return deletedResponse("Grant deleted successfully");
    } catch (error) { return handleApiError(error); }
  })(req);
}
