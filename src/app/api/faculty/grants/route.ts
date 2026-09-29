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
  createGrantInSchema,
  userBasicSelect,
} from "@/lib/api";

export const GET = withRole("FACULTY", async ({ user, req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const status = parseStatusFilter(searchParams, [
      "APPLIED", "GRANTED", "REJECTED", "COMPLETED",
    ] as const);
    const search = parseSearchQuery(searchParams);

    const whereClause: any = {
      OR: [
        { studentAuthors: { some: { userId: user.id } } },
        { facultyAuthors: { some: { userId: user.id } } },
      ],
    };
    if (status) whereClause.grantInStatus = status;
    if (search) {
      whereClause.AND = [{ projectCode: { contains: search, mode: "insensitive" } }];
    }

    const [grants, total] = await Promise.all([
      prisma.grantIn.findMany({
        where: whereClause,
        select: {
          id: true,
          projectCode: true,
          grantInStatus: true,
          applicationDate: true,
          grantDate: true,
          durationOfProject: true,
          amountGranted: true,
          usedAmount: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
          studentAuthors: { select: { id: true, user: { select: userBasicSelect } } },
          facultyAuthors: { select: { id: true, user: { select: userBasicSelect }, role: true, verificationStatus: true } },
          bills: { select: { id: true, billStatus: true, amount: true, billType: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.grantIn.count({ where: whereClause }),
    ]);

    return paginatedResponse(grants, page, limit, total);
  } catch (error) { return handleApiError(error); }
});

export const POST = withRole("FACULTY", async ({ user, req }) => {
  try {
    const body = await req.json();
    const validated = createGrantInSchema.parse(body);

    const grant = await prisma.grantIn.create({
      data: {
        projectCode: validated.projectCode,
        applicationDate: validated.applicationDate ? new Date(validated.applicationDate) : undefined,
        grantDate: validated.grantDate ? new Date(validated.grantDate) : undefined,
        durationOfProject: validated.durationOfProject,
        amountGranted: validated.amountGranted,
        grantInStatus: "APPLIED",
        isPublic: false,
        studentAuthors: { create: validated.studentAuthorIds.map((id) => ({ userId: id })) },
        facultyAuthors: {
          create: [
            { userId: user.id, role: "FACULTY_PI", verificationStatus: "ACCEPTED" as const },
            ...validated.facultyAuthors
              .filter((a) => a.userId !== user.id)
              .map((a) => ({
                userId: a.userId,
                role: a.role,
                verificationStatus: "ACCEPTED" as const,
              })),
          ],
        },
      },
      include: {
        studentAuthors: { include: { user: { select: userBasicSelect } } },
        facultyAuthors: { include: { user: { select: userBasicSelect } } },
      },
    });

    return createdResponse(grant, "Grant application submitted successfully");
  } catch (error) { return handleApiError(error); }
});
