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
  createCopyrightSchema,
  userBasicSelect,
} from "@/lib/api";

export const GET = withRole("FACULTY", async ({ user, req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const status = parseStatusFilter(searchParams, [
      "SUBMITTED", "UNDER_REVIEW", "APPROVED", "PUBLISHED",
    ] as const);
    const search = parseSearchQuery(searchParams);

    const whereClause: any = {
      OR: [
        { studentAuthors: { some: { userId: user.id } } },
        { facultyAuthors: { some: { userId: user.id } } },
      ],
    };
    if (status) whereClause.copyrightStatus = status;
    if (search) {
      whereClause.AND = [{ OR: [
        { title: { contains: search, mode: "insensitive" } },
        { regNo: { contains: search, mode: "insensitive" } },
      ]}];
    }

    const [copyrights, total] = await Promise.all([
      prisma.copyright.findMany({
        where: whereClause,
        select: {
          id: true,
          regNo: true,
          title: true,
          dateOfFiling: true,
          dateOfGrant: true,
          copyrightStatus: true,
          teacherStatus: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
          studentAuthors: { select: { id: true, user: { select: userBasicSelect } } },
          facultyAuthors: { select: { id: true, user: { select: userBasicSelect }, verificationStatus: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.copyright.count({ where: whereClause }),
    ]);

    return paginatedResponse(copyrights, page, limit, total);
  } catch (error) { return handleApiError(error); }
});

export const POST = withRole("FACULTY", async ({ user, req }) => {
  try {
    const body = await req.json();
    const validated = createCopyrightSchema.parse(body);

    const copyright = await prisma.copyright.create({
      data: {
        regNo: validated.regNo,
        title: validated.title,
        abstract: validated.abstract,
        dateOfFiling: validated.dateOfFiling ? new Date(validated.dateOfFiling) : undefined,
        dateOfSubmission: validated.dateOfSubmission ? new Date(validated.dateOfSubmission) : undefined,
        dateOfPublished: validated.dateOfPublished ? new Date(validated.dateOfPublished) : undefined,
        dateOfGrant: validated.dateOfGrant ? new Date(validated.dateOfGrant) : undefined,
        registrationFees: validated.registrationFees,
        reimbursement: validated.reimbursement,
        imageUrl: validated.imageUrl,
        documentUrl: validated.documentUrl,
        copyrightStatus: "SUBMITTED",
        teacherStatus: "UPLOADED",
        isPublic: false,
        studentAuthors: { create: validated.studentAuthorIds.map((id) => ({ userId: id })) },
        facultyAuthors: {
          create: [
            { userId: user.id, verificationStatus: "ACCEPTED" as const },
            ...validated.facultyAuthorIds.filter((id) => id !== user.id).map((id) => ({
              userId: id,
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

    return createdResponse(copyright, "Copyright submitted successfully");
  } catch (error) { return handleApiError(error); }
});
