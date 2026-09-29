import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/public/journals — publicly visible approved/published journals
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page    = Math.max(1, parseInt(searchParams.get("page")  || "1"));
  const limit   = Math.min(50,  parseInt(searchParams.get("limit") || "12"));
  const skip    = (page - 1) * limit;
  const search  = searchParams.get("search");
  const scope   = searchParams.get("scope")?.toUpperCase();
  const indexing = searchParams.get("indexing")?.toUpperCase();

  const where: any = {
    isPublic:      true,
    journalStatus: { in: ["APPROVED", "PUBLISHED"] },
  };
  if (scope)   where.scope   = scope;
  if (indexing) where.indexing = indexing;
  if (search) {
    where.OR = [
      { title:       { contains: search, mode: "insensitive" } },
      { journalName: { contains: search, mode: "insensitive" } },
      { keywords:    { has: search } },
    ];
  }

  try {
    const [data, total] = await Promise.all([
      prisma.journal.findMany({
        where, skip, take: limit,
        select: {
          id: true, title: true, journalName: true, scope: true,
          indexing: true, quartile: true, impactFactor: true,
          publicationDate: true, doi: true, paperLink: true,
          keywords: true, imageUrl: true, journalStatus: true,
          studentAuthors: { select: { user: { select: { id: true, name: true, department: true } } } },
          facultyAuthors: { select: { user: { select: { id: true, name: true, department: true } } } },
        },
        orderBy: { publicationDate: "desc" },
      }),
      prisma.journal.count({ where }),
    ]);
    return NextResponse.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
