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
  createConferenceSchema,
  userBasicSelect,
} from "@/lib/api";

export const GET = withRole("FACULTY", async ({ user, req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const status = parseStatusFilter(searchParams, [
      "SUBMITTED", "UNDER_REVIEW", "APPROVED", "PRESENTED", "PUBLISHED",
    ] as const);
    const search = parseSearchQuery(searchParams);

    const whereClause: any = {
      OR: [
        { studentAuthors: { some: { userId: user.id } } },
        { facultyAuthors: { some: { userId: user.id } } },
      ],
    };
    if (status) whereClause.conferenceStatus = status;
    if (search) {
      whereClause.AND = [{ OR: [
        { conferenceName: { contains: search, mode: "insensitive" } },
        { paperName: { contains: search, mode: "insensitive" } },
      ]}];
    }

    const [conferences, total] = await Promise.all([
      prisma.conference.findMany({
        where: whereClause,
        select: {
          id: true,
          conferenceName: true,
          mode: true,
          conferenceDate: true,
          paperName: true,
          conferenceStatus: true,
          teacherStatus: true,
          isPublic: true,
          registrationFees: true,
          reimbursement: true,
          createdAt: true,
          updatedAt: true,
          studentAuthors: { select: { id: true, user: { select: userBasicSelect } } },
          facultyAuthors: { select: { id: true, user: { select: userBasicSelect }, verificationStatus: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.conference.count({ where: whereClause }),
    ]);

    return paginatedResponse(conferences, page, limit, total);
  } catch (error) { return handleApiError(error); }
});

export const POST = withRole("FACULTY", async ({ user, req }) => {
  try {
    const body = await req.json();
    const validated = createConferenceSchema.parse(body);

    const conference = await prisma.conference.create({
      data: {
        conferenceName: validated.conferenceName,
        mode: validated.mode,
        abstract: validated.abstract,
        keywords: validated.keywords,
        conferencePublisher: validated.conferencePublisher,
        conferenceDate: validated.conferenceDate ? new Date(validated.conferenceDate) : undefined,
        paperDoi: validated.paperDoi,
        paperLink: validated.paperLink,
        paperName: validated.paperName,
        registrationFees: validated.registrationFees,
        reimbursement: validated.reimbursement,
        imageUrl: validated.imageUrl,
        documentUrl: validated.documentUrl,
        conferenceStatus: "SUBMITTED",
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

    return createdResponse(conference, "Conference submitted successfully");
  } catch (error) { return handleApiError(error); }
});
