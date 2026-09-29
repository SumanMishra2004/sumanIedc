import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  withAuth,
  successResponse,
  updatedResponse,
  deletedResponse,
  notFoundResponse,
  forbiddenResponse,
  handleApiError,
  updateAchievementSchema,
} from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async ({ user }) => {
    try {
      const achievement = await prisma.achievement.findUnique({
        where: { id: params.id },
      });

      if (!achievement) return notFoundResponse("Achievement");
      if (achievement.userId !== user.id) {
        return forbiddenResponse("You can only view your own achievements");
      }

      return successResponse(achievement);
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async ({ user }) => {
    try {
      const existing = await prisma.achievement.findUnique({
        where: { id: params.id },
        select: { userId: true, achievementStatus: true },
      });

      if (!existing) return notFoundResponse("Achievement");
      if (existing.userId !== user.id) {
        return forbiddenResponse("You can only update your own achievements");
      }

      if (existing.achievementStatus !== "SUBMITTED") {
        return forbiddenResponse(
          "Cannot update achievement after it has been reviewed"
        );
      }

      const body = await req.json();
      const validated = updateAchievementSchema.parse(body);

      const achievement = await prisma.achievement.update({
        where: { id: params.id },
        data: {
          ...(validated.title && { title: validated.title }),
          ...(validated.description && { description: validated.description }),
          ...(validated.category !== undefined && {
            category: validated.category,
          }),
          ...(validated.year && { year: validated.year }),
          ...(validated.imageUrl !== undefined && {
            imageUrl: validated.imageUrl,
          }),
          ...(validated.documentUrl !== undefined && {
            documentUrl: validated.documentUrl,
          }),
        },
      });

      return updatedResponse(achievement, "Achievement updated successfully");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async ({ user }) => {
    try {
      const existing = await prisma.achievement.findUnique({
        where: { id: params.id },
        select: { userId: true, achievementStatus: true },
      });

      if (!existing) return notFoundResponse("Achievement");
      if (existing.userId !== user.id) {
        return forbiddenResponse("You can only delete your own achievements");
      }

      if (existing.achievementStatus === "APPROVED") {
        return forbiddenResponse("Cannot delete approved achievements");
      }

      await prisma.achievement.delete({ where: { id: params.id } });

      return deletedResponse("Achievement deleted successfully");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}
