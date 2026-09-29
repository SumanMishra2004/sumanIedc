import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  withRole,
  paginatedResponse,
  handleApiError,
  getPaginationParams,
  parseStatusFilter,
} from "@/lib/api";

// GET /api/faculty/verifications
// Faculty can see verification requests where they are listed as the linked faculty
// or requests they submitted (requestedBy)
export const GET = withRole("FACULTY", async ({ user, req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const status = parseStatusFilter(searchParams, [
      "PENDING",
      "ACCEPTED",
      "REJECTED",
    ] as const);

    const whereClause: any = {
      OR: [
        { linkedFacultyId: user.id },
        { requestedById: user.id },
      ],
    };
    if (status) whereClause.status = status;

    const [verifications, total] = await Promise.all([
      prisma.facultyVerificationRequest.findMany({
        where: whereClause,
        select: {
          id: true,
          researchType: true,
          researchId: true,
          facultyName: true,
          facultyEmail: true,
          institution: true,
          department: true,
          status: true,
          verifiedAt: true,
          createdAt: true,
          requestedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.facultyVerificationRequest.count({ where: whereClause }),
    ]);

    return paginatedResponse(verifications, page, limit, total);
  } catch (error) { return handleApiError(error); }
});
