
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";

// GET - Get statistics for certificates
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user with role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build filter based on user role
    // Consistent with BookChapter: Users see what they have access to.
    const roleFilter: any =
      user.role === UserRole.ADMIN
        ? {} // Admin sees all
        : {
            OR: [
              { isPublic: true },
              { userId: user.id }, // Own certificates
            ],
          };

    // Get counts by public/private status
    const publicStatusCounts = await prisma.certificate.groupBy({
      by: ["isPublic"],
      where: roleFilter,
      _count: {
        id: true,
      },
    });

    // Calculate totals
    const total = await prisma.certificate.count({ where: roleFilter });
    
    // Calculate specific counts based on the user's perspective
    // For Admin: All Public, All Private
    // For User: All Public + My Private
    
    const publicCount = await prisma.certificate.count({
        where: {
            AND: [roleFilter, { isPublic: true }]
        }
    });

    const privateCount = await prisma.certificate.count({
        where: {
            AND: [roleFilter, { isPublic: false }]
        }
    });
    
    // My Certificates (regardless of public status) - Useful for dashboard
    const myCertificatesCount = await prisma.certificate.count({
        where: { userId: user.id }
    });

    // Calcluate trending data (Last 12 months)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const certificateForTrend = await prisma.certificate.findMany({
        where: {
            ...roleFilter,
            createdAt: {
                gte: oneYearAgo
            }
        },
        select: {
            createdAt: true
        }
    });

    const monthWiseCounts = certificateForTrend.reduce((acc: { month: string, count: number }[], cert) => {
        const monthYear = `${cert.createdAt.getFullYear()}-${String(cert.createdAt.getMonth() + 1).padStart(2, '0')}`;
        const existing = acc.find(item => item.month === monthYear);
        if (existing) {
            existing.count++;
        } else {
            acc.push({ month: monthYear, count: 1 });
        }
        return acc;
    }, []);

    // Sort by month
    monthWiseCounts.sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({
        total,
        publicCount,
        privateCount,
        monthWiseCounts,
        myCertificates: myCertificatesCount
    });

  } catch (error) {
    console.error("Error fetching certificate stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
