import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  withAuth,
  successResponse,
  paginatedResponse,
  createdResponse,
  getPaginationParams,
  parseStatusFilter,
  parseSearchQuery,
  handleApiError,
  createJournalSchema,
  buildOwnershipFilter,
  userBasicSelect,
} from "@/lib/api";

// ─────────────────────────────────────────────────────────────
// GET /api/student/journals - List student's own journals
// ─────────────────────────────────────────────────────────────

export const GET = withAuth(async ({ user, req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const status = parseStatusFilter(searchParams, [
      "SUBMITTED",
      "UNDER_REVIEW",
      "APPROVED",
      "PUBLISHED",
    ] as const);
    const search = parseSearchQuery(searchParams);

    const whereClause: any = {
      OR: [
        { studentAuthors: { some: { userId: user.id } } },
        { facultyAuthors: { some: { userId: user.id } } },
      ],
    };

    if (status) {
      whereClause.journalStatus = status;
    }

    if (search) {
      whereClause.AND = [
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { journalName: { contains: search, mode: "insensitive" } },
            { keywords: { has: search } },
          ],
        },
      ];
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
          createdAt: true,
          updatedAt: true,
          studentAuthors: {
            select: {
              id: true,
              user: { select: userBasicSelect },
            },
          },
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
  } catch (error) {
    return handleApiError(error);
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/student/journals - Create new journal
// ─────────────────────────────────────────────────────────────

export const POST = withAuth(async ({ user, req }) => {
  try {
    const body = await req.json();
    const validated = createJournalSchema.parse(body);

    // Create journal with student as author
    const journal = await prisma.journal.create({
      data: {
        title: validated.title,
        journalName: validated.journalName,
        abstract: validated.abstract,
        scope: validated.scope,
        reviewType: validated.reviewType,
        accessType: validated.accessType,
        indexing: validated.indexing,
        quartile: validated.quartile,
        impactFactor: validated.impactFactor,
        impactFactorDate: validated.impactFactorDate
          ? new Date(validated.impactFactorDate)
          : undefined,
        publisher: validated.publisher,
        publicationMode: validated.publicationMode,
        publicationDate: validated.publicationDate
          ? new Date(validated.publicationDate)
          : undefined,
        doi: validated.doi,
        paperLink: validated.paperLink,
        keywords: validated.keywords,
        registrationFees: validated.registrationFees,
        reimbursement: validated.reimbursement,
        imageUrl: validated.imageUrl,
        documentUrl: validated.documentUrl,
        journalStatus: "SUBMITTED",
        teacherStatus: "UPLOADED",
        isPublic: false,
        studentAuthors: {
          create: [
            { userId: user.id },
            ...validated.studentAuthorIds
              .filter((id) => id !== user.id)
              .map((id) => ({ userId: id })),
          ],
        },
        facultyAuthors: {
          create: [
            ...validated.facultyAuthorIds.map((id) => ({
              userId: id,
              verificationStatus: "ACCEPTED" as const,
            })),
          ],
        },
      },
      include: {
        studentAuthors: {
          include: { user: { select: userBasicSelect } },
        },
        facultyAuthors: {
          include: { user: { select: userBasicSelect } },
        },
      },
    });

    return createdResponse(journal, "Journal submitted successfully");
  } catch (error) {
    return handleApiError(error);
  }
});
