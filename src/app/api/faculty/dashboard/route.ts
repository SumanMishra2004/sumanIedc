import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withRole, successResponse, handleApiError } from "@/lib/api";

// GET /api/faculty/dashboard - Faculty dashboard stats
export const GET = withRole("FACULTY", async ({ user }) => {
  try {
    const authorFilter = {
      OR: [
        { studentAuthors: { some: { userId: user.id } } },
        { facultyAuthors: { some: { userId: user.id } } },
      ],
    };

    const [
      journalsCount,
      bookChaptersCount,
      conferencesCount,
      patentsCount,
      copyrightsCount,
      grantsCount,
      fdpsCount,
      achievementsCount,
      certificatesCount,
      unreadNotifications,
      pendingVerifications,
      journalsByStatus,
      recentActivity,
    ] = await Promise.all([
      prisma.journal.count({ where: authorFilter }),
      prisma.bookChapter.count({ where: authorFilter }),
      prisma.conference.count({ where: authorFilter }),
      prisma.patent.count({ where: authorFilter }),
      prisma.copyright.count({ where: authorFilter }),
      prisma.grantIn.count({ where: authorFilter }),
      prisma.fDP.count({ where: { userId: user.id } }),
      prisma.achievement.count({ where: { userId: user.id } }),
      prisma.certificate.count({ where: { userId: user.id } }),
      prisma.notification.count({ where: { userId: user.id, read: false } }),
      prisma.facultyVerificationRequest.count({
        where: {
          OR: [{ linkedFacultyId: user.id }, { facultyEmail: user.email }],
          status: "PENDING",
        },
      }),
      prisma.journal.groupBy({
        by: ["journalStatus"],
        where: authorFilter,
        _count: true,
      }),
      prisma.journal.findMany({
        where: authorFilter,
        select: { id: true, title: true, journalStatus: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    // Grant financial summary
    const grantSummary = await prisma.grantIn.aggregate({
      where: authorFilter,
      _sum: { amountGranted: true, usedAmount: true },
    });

    return successResponse({
      overview: {
        journals: journalsCount,
        bookChapters: bookChaptersCount,
        conferences: conferencesCount,
        patents: patentsCount,
        copyrights: copyrightsCount,
        grants: grantsCount,
        fdps: fdpsCount,
        achievements: achievementsCount,
        certificates: certificatesCount,
        totalResearch:
          journalsCount + bookChaptersCount + conferencesCount + patentsCount + copyrightsCount,
      },
      notifications: { unread: unreadNotifications },
      verifications: { pending: pendingVerifications },
      journalsByStatus: Object.fromEntries(
        journalsByStatus.map((item) => [item.journalStatus, item._count])
      ),
      grants: {
        totalGranted: grantSummary._sum.amountGranted ?? 0,
        totalUsed: grantSummary._sum.usedAmount ?? 0,
      },
      recentActivity,
    });
  } catch (error) { return handleApiError(error); }
});
