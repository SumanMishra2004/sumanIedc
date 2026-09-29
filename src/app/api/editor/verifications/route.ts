import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/auth/guard";
import { FacultyVerificationStatus } from "@prisma/client";

// GET /api/editor/verifications - view all verification requests
export async function GET(req: NextRequest) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, parseInt(searchParams.get("page")  || "1"));
  const limit  = Math.min(100, parseInt(searchParams.get("limit") || "20"));
  const skip   = (page - 1) * limit;
  const status = searchParams.get("status")?.toUpperCase() as FacultyVerificationStatus | undefined;
  const search = searchParams.get("search");

  const where: any = {};
  if (status && Object.values(FacultyVerificationStatus).includes(status)) where.status = status;
  if (search) {
    where.OR = [
      { facultyName: { contains: search, mode: "insensitive" } },
      { facultyEmail: { contains: search, mode: "insensitive" } },
      { institution: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [data, total] = await Promise.all([
      prisma.facultyVerificationRequest.findMany({
        where, skip, take: limit,
        select: {
          id: true,
          researchType: true,
          researchId: true,
          facultyName: true,
          facultyEmail: true,
          institution: true,
          department: true,
          designation: true,
          status: true,
          verifiedAt: true,
          createdAt: true,
          tokenExpiry: true,
          tokenUsed: true,
          requestedBy: { select: { id: true, name: true, email: true } },
          linkedFaculty:  { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.facultyVerificationRequest.count({ where }),
    ]);
    return NextResponse.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
