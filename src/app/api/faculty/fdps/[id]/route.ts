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
  updateFDPSchema,
} from "@/lib/api";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const fdp = await prisma.fDP.findUnique({ where: { id: params.id } });
      if (!fdp) return notFoundResponse("FDP");
      if (fdp.userId !== user.id) return forbiddenResponse("You can only view your own FDPs");
      return successResponse(fdp);
    } catch (error) { return handleApiError(error); }
  })(req);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const existing = await prisma.fDP.findUnique({
        where: { id: params.id },
        select: { userId: true, fdpStatus: true },
      });
      if (!existing) return notFoundResponse("FDP");
      if (existing.userId !== user.id) return forbiddenResponse("You can only update your own FDPs");
      if (existing.fdpStatus !== "SUBMITTED") return forbiddenResponse("Cannot update FDP after it has been reviewed");

      const body = await req.json();
      const validated = updateFDPSchema.parse(body);

      const fdp = await prisma.fDP.update({
        where: { id: params.id },
        data: {
          ...(validated.title && { title: validated.title }),
          ...(validated.description !== undefined && { description: validated.description }),
          ...(validated.keywords && { keywords: validated.keywords }),
          ...(validated.organizedBy !== undefined && { organizedBy: validated.organizedBy }),
          ...(validated.startDate && { startDate: new Date(validated.startDate) }),
          ...(validated.endDate && { endDate: new Date(validated.endDate) }),
          ...(validated.topic !== undefined && { topic: validated.topic }),
          ...(validated.duration !== undefined && { duration: validated.duration }),
          ...(validated.remark !== undefined && { remark: validated.remark }),
        },
      });

      return updatedResponse(fdp, "FDP updated successfully");
    } catch (error) { return handleApiError(error); }
  })(req);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const existing = await prisma.fDP.findUnique({
        where: { id: params.id },
        select: { userId: true, fdpStatus: true },
      });
      if (!existing) return notFoundResponse("FDP");
      if (existing.userId !== user.id) return forbiddenResponse("You can only delete your own FDPs");
      if (existing.fdpStatus !== "SUBMITTED") return forbiddenResponse("Cannot delete FDP after it has been reviewed");

      await prisma.fDP.delete({ where: { id: params.id } });
      return deletedResponse("FDP deleted successfully");
    } catch (error) { return handleApiError(error); }
  })(req);
}
