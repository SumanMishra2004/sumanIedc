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
    copyrightStatus: { in: ["APPROVED", "PUBLISHED"] },
  };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { regNo: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [data, total] = await Promise.all([
      prisma.copyright.findMany({
        where, skip, take: limit,
        select: {
          id: true, regNo: true, title: true, abstract: true,
          dateOfFiling: true, dateOfGrant: true, imageUrl: true,
          copyrightStatus: true,
          studentAuthors: { select: { user: { select: { id: true, name: true, department: true } } } },
          facultyAuthors: { select: { user: { select: { id: true, name: true, department: true } } } },
        },
        orderBy: { dateOfGrant: "desc" },
      }),
      prisma.copyright.count({ where }),
    ]);
    return NextResponse.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
