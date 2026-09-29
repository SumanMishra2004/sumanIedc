import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  withRole,
  paginatedResponse,
  getPaginationParams,
  parseStatusFilter,
  parseSearchQuery,
  handleApiError,
  userBasicSelect,
} from "@/lib/api";

// GET /api/editor/journals - All journals across all users
export const GET = withRole("EDITOR", async ({ user: _user, req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const status = parseStatusFilter(searchParams, [
      "SUBMITTED", "UNDER_REVIEW", "APPROVED", "PUBLISHED",
    ] as const);
    const teacherStatus = searchParams.get("teacherStatus")?.toUpperCase();
    const search = parseSearchQuery(searchParams);
    const department = searchParams.get("department");

    const whereClause: any = {};
    if (status) whereClause.journalStatus = status;
    if (teacherStatus) whereClause.teacherStatus = teacherStatus;
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { journalName: { contains: search, mode: "insensitive" } },
        { serialNo: { contains: search, mode: "insensitive" } },
      ];
    }
    if (department) {
      whereClause.studentAuthors = {
        some: { user: { department: { contains: department, mode: "insensitive" } } },
      };
    }

    const [journals, total] = await Promise.all([
      prisma.journal.findMany({
        where: whereClause,
        select: {
          id: true,
          serialNo: true,
          title: true,
          journalName: true,
          scope: true,
          indexing: true,
          quartile: true,
          impactFactor: true,
          publicationDate: true,
          journalStatus: true,
          teacherStatus: true,
          isPublic: true,
          registrationFees: true,
          reimbursement: true,
          updateComment: true,
          createdAt: true,
          updatedAt: true,
          studentAuthors: { select: { id: true, user: { select: userBasicSelect } } },
          facultyAuthors: {
            select: {
              id: true,
              user: { select: userBasicSelect },
              verificationStatus: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.journal.count({ where: whereClause }),
    ]);

    return paginatedResponse(journals, page, limit, total);
  } catch (error) { return handleApiError(error); }
});
