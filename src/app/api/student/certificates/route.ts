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
  createCertificateSchema,
} from "@/lib/api";

// GET /api/student/certificates
export const GET = withAuth(async ({ user, req }) => {
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

    if (status) whereClause.certificateStatus = status;
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { offeredBy: { contains: search, mode: "insensitive" } },
        { keywords: { has: search } },
      ];
    }

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          offeredBy: true,
          dateOfCompletion: true,
          certificateStatus: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { dateOfCompletion: "desc" },
        skip,
        take: limit,
      }),
      prisma.certificate.count({ where: whereClause }),
    ]);

    return paginatedResponse(certificates, page, limit, total);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/student/certificates
export const POST = withAuth(async ({ user, req }) => {
  try {
    const body = await req.json();
    const validated = createCertificateSchema.parse(body);

    const certificate = await prisma.certificate.create({
      data: {
        userId: user.id,
        title: validated.title,
        description: validated.description,
        keywords: validated.keywords,
        documentUrl: validated.documentUrl,
        offeredBy: validated.offeredBy,
        dateOfCompletion: new Date(validated.dateOfCompletion),
        remark: validated.remark,
        certificateStatus: "SUBMITTED",
        isPublic: true,
      },
    });

    return createdResponse(certificate, "Certificate submitted successfully");
  } catch (error) {
    return handleApiError(error);
  }
});
