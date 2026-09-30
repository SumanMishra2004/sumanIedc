import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api/middleware";
import { safeDelete } from "@/lib/api/security";
import { updatedResponse, deletedResponse, notFoundResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/error-handler";

// PATCH /api/student/notifications/[id] — mark as read/unread
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(async ({ user }) => {
    try {
      const { id } = await params;

      // Fetch & ownership check in one query — return 404 for both missing and not-owned
      // to avoid leaking notification existence to other users
      const existing = await prisma.notification.findFirst({
        where: { id, userId: user.id },
        select: { id: true },
      });
      if (!existing) return notFoundResponse("Notification");

      const body = await req.json();

      // Only the `read` boolean is updatable — no other fields allowed
      const notification = await prisma.notification.update({
        where: { id },
        data: { read: body.read === false ? false : true },
      });

      return updatedResponse(notification, "Notification updated");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}

// DELETE /api/student/notifications/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(async ({ user }) => {
    try {
      const { id } = await params;

      // Combined ownership + existence check — returns 404 for not-owned
      const existing = await prisma.notification.findFirst({
        where: { id, userId: user.id },
        select: { id: true },
      });
      if (!existing) return notFoundResponse("Notification");

      const deleteResult = await safeDelete(prisma.notification, id, "Notification");
      if (!deleteResult.success) return deleteResult.response;

      return deletedResponse("Notification deleted");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}
