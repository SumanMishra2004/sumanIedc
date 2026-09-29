import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";

// GET /api/admin/dashboard - comprehensive platform stats for admin
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;

  try {
    const [
      totalUsers,
      usersByRole,
      totalJournals,
      journalsByStatus,
      totalBookChapters,
      totalConferences,
      totalPatents,
      totalCopyrights,
      totalGrants,
      grantFinancials,
      totalAchievements,
      totalCertificates,
      totalFDPs,
      totalEvents,
      pendingVerifications,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.groupBy({ by: ["role"], where: { deletedAt: null }, _count: true }),
      prisma.journal.count(),
      prisma.journal.groupBy({ by: ["journalStatus"], _count: true }),
      prisma.bookChapter.count(),
      prisma.conference.count(),
      prisma.patent.count(),
      prisma.copyright.count(),
      prisma.grantIn.count(),
      prisma.grantIn.aggregate({
        _sum: { amountGranted: true, usedAmount: true },
      }),
      prisma.achievement.count(),
      prisma.certificate.count(),
      prisma.fDP.count(),
      prisma.event.count(),
      prisma.facultyVerificationRequest.count({ where: { status: "PENDING" } }),
      prisma.user.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          byRole: Object.fromEntries(usersByRole.map((r) => [r.role, r._count])),
          recentSignups: recentUsers,
        },
        research: {
          journals: totalJournals,
          journalsByStatus: Object.fromEntries(journalsByStatus.map((j) => [j.journalStatus, j._count])),
          bookChapters: totalBookChapters,
          conferences: totalConferences,
          patents: totalPatents,
          copyrights: totalCopyrights,
          grants: totalGrants,
          grantFinancials: {
            totalGranted: grantFinancials._sum.amountGranted ?? 0,
            totalUsed: grantFinancials._sum.usedAmount ?? 0,
          },
        },
        other: {
          achievements: totalAchievements,
          certificates: totalCertificates,
          fdps: totalFDPs,
          events: totalEvents,
        },
        verifications: { pending: pendingVerifications },
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
