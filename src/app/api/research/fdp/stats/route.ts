import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { FDPStatus } from "@prisma/client";

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

    // Get counts
    const [total, submitted, underReview, approved, fdpsForTrends] = await Promise.all([
      prisma.fDP.count({ where }),
      prisma.fDP.count({
        where: { ...where, fdpStatus: FDPStatus.SUBMITTED }
      }),
      prisma.fDP.count({
        where: { ...where, fdpStatus: FDPStatus.UNDER_REVIEW }
      }),
      prisma.fDP.count({
        where: { ...where, fdpStatus: FDPStatus.APPROVED }
      }),
      prisma.fDP.findMany({
        where,
        select: { startDate: true },
        orderBy: { startDate: "asc" },
      }),
    ]);

    // Calculate monthWiseCounts based on startDate
    const monthlyCounts: Record<string, number> = {};
    for (const f of fdpsForTrends) {
      const date = f.startDate ? new Date(f.startDate) : null;
      if (date) {
        const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
        monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
      }
    }

    const monthWiseCounts = Object.entries(monthlyCounts).map(([month, count]) => ({
      month,
      count,
    })).sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({
      total,
      submitted,
      underReview,
      approved,
      monthWiseCounts,
    });

  } catch (error) {
    console.error("Error fetching FDP stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
