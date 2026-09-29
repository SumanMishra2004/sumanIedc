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
  createBookChapterSchema,
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
    if (status) whereClause.bookChapterStatus = status;
    if (search) {
      whereClause.AND = [{ OR: [
        { title: { contains: search, mode: "insensitive" } },
        { publisher: { contains: search, mode: "insensitive" } },
      ]}];
    }

    const [bookChapters, total] = await Promise.all([
      prisma.bookChapter.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          publisher: true,
          publicationDate: true,
          bookChapterStatus: true,
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
      prisma.bookChapter.count({ where: whereClause }),
    ]);

    return paginatedResponse(bookChapters, page, limit, total);
  } catch (error) { return handleApiError(error); }
});

export const POST = withRole("FACULTY", async ({ user, req }) => {
  try {
    const body = await req.json();
    const validated = createBookChapterSchema.parse(body);

    const bookChapter = await prisma.bookChapter.create({
      data: {
        title: validated.title,
        abstract: validated.abstract,
        isbnIssn: validated.isbnIssn,
        publisher: validated.publisher,
        publicationDate: validated.publicationDate ? new Date(validated.publicationDate) : undefined,
        doi: validated.doi,
        keywords: validated.keywords,
        registrationFees: validated.registrationFees,
        reimbursement: validated.reimbursement,
        imageUrl: validated.imageUrl,
        documentUrl: validated.documentUrl,
        bookChapterStatus: "SUBMITTED",
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

    return createdResponse(bookChapter, "Book chapter submitted successfully");
  } catch (error) { return handleApiError(error); }
});
