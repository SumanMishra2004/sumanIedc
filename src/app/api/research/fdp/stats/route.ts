
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { auth } from "@/lib/auth";

// GET - Get statistics for FDPs
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "FACULTY" && user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const where: any = {};
    if (user.role !== "ADMIN") {
        where.userId = user.id;
    }

    // Get total count
    const total = await prisma.fDP.count({ where });

    // Maybe group by topic or organizedBy?
    // Let's provide some breakdown if useful, or just total for now.
    // Group by 'topic' might be too sparse.
    
    // Let's just return total and maybe 'my FDPs' vs 'all' if admin.
    
    return NextResponse.json({
        total,
        // Since FDP doesn't have status enums like 'teacherStatus' or 'bookChapterStatus',
        // we can't provide those breakdowns.
        // We can add a count for "current year" if we want, but keeping it simple like 'total' is safer.
    });

  } catch (error) {
    console.error("Error fetching FDP stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
