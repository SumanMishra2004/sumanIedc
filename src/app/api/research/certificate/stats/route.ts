import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UserRole, CertificateStatus } from "@prisma/client";
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
    const roleFilter: any =
      user.role === UserRole.ADMIN
        ? {} // Admin sees all
        : {
            OR: [
              { isPublic: true },
              { userId: user.id }, // Own certificates
            ],
          };

    // Calculate totals
    const total = await prisma.certificate.count({ where: roleFilter });
    
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
    
    // Get counts by certificateStatus
    const certificateStatusCounts = await prisma.certificate.groupBy({
      by: ['certificateStatus'],
      where: roleFilter,
      _count: {
        id: true
      }
    });

    const formattedStatusCounts = certificateStatusCounts.reduce((acc, curr) => {
      acc[curr.certificateStatus] = curr._count.id;
      return acc;
    }, {} as Record<string, number>);

    // My Certificates (regardless of public status) - Useful for dashboard
    const myCertificatesCount = await prisma.certificate.count({
      where: { userId: user.id }
    });

    // Calculate trending data (Last 12 months)
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
      submitted: formattedStatusCounts[CertificateStatus.SUBMITTED] || 0,
      underReview: formattedStatusCounts[CertificateStatus.UNDER_REVIEW] || 0,
      approved: formattedStatusCounts[CertificateStatus.APPROVED] || 0,
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
