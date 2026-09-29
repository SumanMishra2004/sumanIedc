import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  withAuth,
  updatedResponse,
  deletedResponse,
  notFoundResponse,
  forbiddenResponse,
  handleApiError,
} from "@/lib/api";

// PATCH /api/student/notifications/[id] - Mark as read/unread
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async ({ user }) => {
    try {
      const existing = await prisma.notification.findUnique({
        where: { id: params.id },
        select: { userId: true },
      });

      if (!existing) return notFoundResponse("Notification");
      if (existing.userId !== user.id) {
        return forbiddenResponse("You can only update your own notifications");
      }

      const body = await req.json();
      const { read } = body;

      const notification = await prisma.notification.update({
        where: { id: params.id },
        data: { read: read ?? true },
      });

      return updatedResponse(notification, "Notification updated successfully");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}

// DELETE /api/student/notifications/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async ({ user }) => {
    try {
      const existing = await prisma.notification.findUnique({
        where: { id: params.id },
        select: { userId: true },
      });

      if (!existing) return notFoundResponse("Notification");
      if (existing.userId !== user.id) {
        return forbiddenResponse("You can only delete your own notifications");
      }

      await prisma.notification.delete({ where: { id: params.id } });

      return deletedResponse("Notification deleted successfully");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}
