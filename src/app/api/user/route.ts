import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Authenticated users only
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized — authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const search = searchParams.get("search");
    const department = searchParams.get("department");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    // Build where clause
    const andClauses: object[] = [];

    if (role && ["STUDENT", "FACULTY", "ADMIN"].includes(role.toUpperCase())) {
      andClauses.push({ role: role.toUpperCase() as "STUDENT" | "FACULTY" | "ADMIN" });
    }

    if (department) {
      andClauses.push({
        department: { contains: department, mode: "insensitive" as const },
      });
    }

    if (search) {
      andClauses.push({
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      });
    }

    const whereClause = andClauses.length > 0 ? { AND: andClauses } : {};

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          department: true,
          phone: true,
          bio: true,
          profileCompleted: true,
          emailVerified: true,
        },
        // CUIDs are time-sortable — newest first
        orderBy: { id: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + users.length < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}