import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  withAuth,
  paginatedResponse,
  createdResponse,
  getPaginationParams,
  parseStatusFilter,
  parseSearchQuery,
  handleApiError,
  createAchievementSchema,
} from "@/lib/api";

// GET /api/student/achievements
export const GET = withAuth(async ({ user, req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const status = parseStatusFilter(searchParams, [
      "SUBMITTED",
      "UNDER_REVIEW",
      "APPROVED",
      "REJECTED",
    ] as const);
    const search = parseSearchQuery(searchParams);

    const whereClause: any = { userId: user.id };

    if (status) whereClause.achievementStatus = status;
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    const [achievements, total] = await Promise.all([
      prisma.achievement.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          year: true,
          imageUrl: true,
          achievementStatus: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { year: "desc" },
        skip,
        take: limit,
      }),
      prisma.achievement.count({ where: whereClause }),
    ]);

    return paginatedResponse(achievements, page, limit, total);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/student/achievements
export const POST = withAuth(async ({ user, req }) => {
  try {
    const body = await req.json();
    const validated = createAchievementSchema.parse(body);

    const achievement = await prisma.achievement.create({
      data: {
        userId: user.id,
        title: validated.title,
        description: validated.description,
        category: validated.category,
        year: validated.year,
        imageUrl: validated.imageUrl,
        documentUrl: validated.documentUrl,
        achievementStatus: "SUBMITTED",
        isPublic: false,
      },
    });

    return createdResponse(achievement, "Achievement submitted successfully");
  } catch (error) {
    return handleApiError(error);
  }
});
