import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get("page")  || "1"));
  const limit = Math.min(50,  parseInt(searchParams.get("limit") || "12"));
  const skip  = (page - 1) * limit;
  const search = searchParams.get("search");

  const where: any = {
    isPublic:        true,
    conferenceStatus: { in: ["APPROVED", "PRESENTED", "PUBLISHED"] },
  };
  if (search) {
    where.OR = [
      { conferenceName: { contains: search, mode: "insensitive" } },
      { paperName:      { contains: search, mode: "insensitive" } },
      { keywords:       { has: search } },
    ];
  }

  try {
    const [data, total] = await Promise.all([
      prisma.conference.findMany({
        where, skip, take: limit,
        select: {
          id: true, conferenceName: true, mode: true, paperName: true,
          conferenceDate: true, paperDoi: true, paperLink: true,
          keywords: true, imageUrl: true, conferenceStatus: true,
          studentAuthors: { select: { user: { select: { id: true, name: true, department: true } } } },
          facultyAuthors: { select: { user: { select: { id: true, name: true, department: true } } } },
        },
        orderBy: { conferenceDate: "desc" },
      }),
      prisma.conference.count({ where }),
    ]);
    return NextResponse.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
