import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  withAuth,
  paginatedResponse,
  handleApiError,
  getPaginationParams,
  parseBooleanFilter,
} from "@/lib/api";

// GET /api/student/notifications
export const GET = withAuth(async ({ user, req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const read = parseBooleanFilter(searchParams, "read");

    const whereClause: any = { userId: user.id };
    if (read !== undefined) {
      whereClause.read = read;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          link: true,
          read: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: whereClause }),
    ]);

    return paginatedResponse(notifications, page, limit, total);
  } catch (error) {
    return handleApiError(error);
  }
});
