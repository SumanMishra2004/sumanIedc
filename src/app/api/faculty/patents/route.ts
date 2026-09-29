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
  createPatentSchema,
  userBasicSelect,
} from "@/lib/api";

export const GET = withRole("FACULTY", async ({ user, req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const status = parseStatusFilter(searchParams, [
      "SUBMITTED", "UNDER_REVIEW", "APPROVED", "GRANTED",
    ] as const);
    const search = parseSearchQuery(searchParams);

    const whereClause: any = {
      OR: [
        { studentAuthors: { some: { userId: user.id } } },
        { facultyAuthors: { some: { userId: user.id } } },
      ],
    };
    if (status) whereClause.patentStatus = status;
    if (search) {
      whereClause.AND = [{ OR: [
        { title: { contains: search, mode: "insensitive" } },
        { applicationNo: { contains: search, mode: "insensitive" } },
      ]}];
    }

    const [patents, total] = await Promise.all([
      prisma.patent.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          applicationNo: true,
          grantedPatentNo: true,
          filingDate: true,
          patentStatus: true,
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
      prisma.patent.count({ where: whereClause }),
    ]);

    return paginatedResponse(patents, page, limit, total);
  } catch (error) { return handleApiError(error); }
});

export const POST = withRole("FACULTY", async ({ user, req }) => {
  try {
    const body = await req.json();
    const validated = createPatentSchema.parse(body);

    const patent = await prisma.patent.create({
      data: {
        title: validated.title,
        keywords: validated.keywords,
        abstract: validated.abstract,
        applicationNo: validated.applicationNo,
        grantedPatentNo: validated.grantedPatentNo,
        filingDate: validated.filingDate ? new Date(validated.filingDate) : undefined,
        submissionDate: validated.submissionDate ? new Date(validated.submissionDate) : undefined,
        publicationDate: validated.publicationDate ? new Date(validated.publicationDate) : undefined,
        grantDate: validated.grantDate ? new Date(validated.grantDate) : undefined,
        patentLink: validated.patentLink,
        imageUrl: validated.imageUrl,
        documentUrl: validated.documentUrl,
        patentStatus: "SUBMITTED",
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

    return createdResponse(patent, "Patent submitted successfully");
  } catch (error) { return handleApiError(error); }
});
