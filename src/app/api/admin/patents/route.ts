import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { PatentStatus, TeacherStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get("page")  || "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));
  const skip  = (page - 1) * limit;
  const status = searchParams.get("status")?.toUpperCase()        as PatentStatus  | undefined;
  const ts     = searchParams.get("teacherStatus")?.toUpperCase() as TeacherStatus | undefined;
  const search = searchParams.get("search");

  const where: any = {};
  if (status && Object.values(PatentStatus).includes(status))   where.patentStatus  = status;
  if (ts     && Object.values(TeacherStatus).includes(ts))      where.teacherStatus = ts;
  if (search) {
    where.OR = [
      { title:           { contains: search, mode: "insensitive" } },
      { applicationNo:   { contains: search, mode: "insensitive" } },
      { grantedPatentNo: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [data, total] = await Promise.all([
      prisma.patent.findMany({
        where, skip, take: limit,
        include: {
          studentAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
          facultyAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.patent.count({ where }),
    ]);
    return NextResponse.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
