import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  withRole,
  paginatedResponse,
  createdResponse,
  getPaginationParams,
  parseStatusFilter,
  parseSearchQuery,
  handleApiError,
  createFDPSchema,
} from "@/lib/api";

// GET /api/faculty/fdps
export const GET = withRole("FACULTY", async ({ user, req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const status = parseStatusFilter(searchParams, [
      "SUBMITTED",
      "UNDER_REVIEW",
      "APPROVED",
    ] as const);
    const search = parseSearchQuery(searchParams);

    const whereClause: any = { userId: user.id };

    if (status) whereClause.fdpStatus = status;
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { organizedBy: { contains: search, mode: "insensitive" } },
        { keywords: { has: search } },
      ];
    }

    const [fdps, total] = await Promise.all([
      prisma.fDP.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          organizedBy: true,
          startDate: true,
          endDate: true,
          duration: true,
          fdpStatus: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { startDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.fDP.count({ where: whereClause }),
    ]);

    return paginatedResponse(fdps, page, limit, total);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/faculty/fdps
export const POST = withRole("FACULTY", async ({ user, req }) => {
  try {
    const body = await req.json();
    const validated = createFDPSchema.parse(body);

    const fdp = await prisma.fDP.create({
      data: {
        userId: user.id,
        title: validated.title,
        description: validated.description,
        keywords: validated.keywords,
        organizedBy: validated.organizedBy,
        startDate: validated.startDate ? new Date(validated.startDate) : undefined,
        endDate: validated.endDate ? new Date(validated.endDate) : undefined,
        topic: validated.topic,
        duration: validated.duration,
        remark: validated.remark,
        fdpStatus: "SUBMITTED",
        isPublic: false,
      },
    });

    return createdResponse(fdp, "FDP submitted successfully");
  } catch (error) {
    return handleApiError(error);
  }
});
