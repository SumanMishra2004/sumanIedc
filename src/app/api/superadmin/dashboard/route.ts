import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";

// GET /api/superadmin/dashboard — full platform overview
export async function GET(req: NextRequest) {
  const guard = await requireSuperAdmin(req);
  if (!guard.ok) return guard.response;

  try {
    const [
      totalUsers, activeUsers, inactiveUsers, deletedUsers,
      usersByRole, specialUsers,
      totalJournals, totalBookChapters, totalConferences,
      totalPatents, totalCopyrights, totalGrants, grantFinancials,
      totalAchievements, totalCertificates, totalFDPs,
      totalEvents, pendingVerifications,
      lockedAccounts, recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true,  deletedAt: null } }),
      prisma.user.count({ where: { isActive: false, deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: { not: null } } }),
      prisma.user.groupBy({ by: ["role"], _count: true }),
      prisma.specialUser.count(),
      prisma.journal.count(),
      prisma.bookChapter.count(),
      prisma.conference.count(),
      prisma.patent.count(),
      prisma.copyright.count(),
      prisma.grantIn.count(),
      prisma.grantIn.aggregate({ _sum: { amountGranted: true, usedAmount: true } }),
      prisma.achievement.count(),
      prisma.certificate.count(),
      prisma.fDP.count(),
      prisma.event.count(),
      prisma.facultyVerificationRequest.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { lockedUntil: { gt: new Date() } } }),
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers, active: activeUsers,
          inactive: inactiveUsers, deleted: deletedUsers,
          locked: lockedAccounts,
          byRole: Object.fromEntries(usersByRole.map((r) => [r.role, r._count])),
          specialUsers, recent: recentUsers,
        },
        research: {
          journals: totalJournals, bookChapters: totalBookChapters,
          conferences: totalConferences, patents: totalPatents,
          copyrights: totalCopyrights, grants: totalGrants,
          grantFinancials: {
            totalGranted: grantFinancials._sum.amountGranted ?? 0,
            totalUsed:    grantFinancials._sum.usedAmount    ?? 0,
          },
        },
        other: {
          achievements: totalAchievements, certificates: totalCertificates,
          fdps: totalFDPs, events: totalEvents,
        },
        verifications: { pending: pendingVerifications },
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
