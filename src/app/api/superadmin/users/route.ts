import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { UserRole } from "@prisma/client";

// GET /api/superadmin/users — full user list including soft-deleted, all roles
export async function GET(req: NextRequest) {
  const guard = await requireSuperAdmin(req);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const page     = Math.max(1, parseInt(searchParams.get("page")  || "1"));
  const limit    = Math.min(100, parseInt(searchParams.get("limit") || "20"));
  const skip     = (page - 1) * limit;
  const role     = searchParams.get("role")?.toUpperCase()     as UserRole | undefined;
  const search   = searchParams.get("search");
  const deleted  = searchParams.get("deleted") === "true";
  const inactive = searchParams.get("inactive") === "true";

  const where: any = {};
  if (role && Object.values(UserRole).includes(role)) where.role = role;
  if (deleted)  where.deletedAt = { not: null };
  if (inactive) where.isActive  = false;
  if (search) {
    where.OR = [
      { name:  { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: limit,
        select: {
          id: true, name: true, email: true, role: true, image: true,
          department: true, institution: true, isActive: true,
          profileCompleted: true, emailVerified: true,
          lastLoginAt: true, createdAt: true, deletedAt: true,
          failedLoginAttempts: true, lockedUntil: true,
          enrollmentNo: true, designation: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);
    return NextResponse.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
