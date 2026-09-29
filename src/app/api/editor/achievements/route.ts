import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/auth/guard";
import { AchievementStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));
  const skip = (page - 1) * limit;
  const status = searchParams.get("status")?.toUpperCase() as AchievementStatus | undefined;
  const search = searchParams.get("search");

  const where: any = {};
  if (status && Object.values(AchievementStatus).includes(status)) where.achievementStatus = status;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  try {
    const [data, total] = await Promise.all([
      prisma.achievement.findMany({
        where, skip, take: limit,
        include: { user: { select: { id: true, name: true, email: true, department: true, role: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.achievement.count({ where }),
    ]);
    return NextResponse.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
