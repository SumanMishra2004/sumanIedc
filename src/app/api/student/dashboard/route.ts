import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, successResponse, handleApiError } from "@/lib/api";

// GET /api/student/dashboard - Student dashboard stats
export const GET = withAuth(async ({ user }) => {
  try {
    const [
      journalsCount,
      bookChaptersCount,
      certificatesCount,
      achievementsCount,
      patentsCount,
      copyrightsCount,
      conferencesCount,
      grantsCount,
      fdpsCount,
      unreadNotifications,
      recentSubmissions,
    ] = await Promise.all([
      // Count journals
      prisma.journal.count({
        where: {
          OR: [
            { studentAuthors: { some: { userId: user.id } } },
            { facultyAuthors: { some: { userId: user.id } } },
          ],
        },
      }),
      // Count book chapters
      prisma.bookChapter.count({
        where: {
          OR: [
            { studentAuthors: { some: { userId: user.id } } },
            { facultyAuthors: { some: { userId: user.id } } },
          ],
        },
      }),
      // Count certificates
      prisma.certificate.count({ where: { userId: user.id } }),
      // Count achievements
      prisma.achievement.count({ where: { userId: user.id } }),
      // Count patents
      prisma.patent.count({
        where: {
          OR: [
            { studentAuthors: { some: { userId: user.id } } },
            { facultyAuthors: { some: { userId: user.id } } },
          ],
        },
      }),
      // Count copyrights
      prisma.copyright.count({
        where: {
          OR: [
            { studentAuthors: { some: { userId: user.id } } },
            { facultyAuthors: { some: { userId: user.id } } },
          ],
        },
      }),
      // Count conferences
      prisma.conference.count({
        where: {
          OR: [
            { studentAuthors: { some: { userId: user.id } } },
            { facultyAuthors: { some: { userId: user.id } } },
          ],
        },
      }),
      // Count grants
      prisma.grantIn.count({
        where: {
          OR: [
            { studentAuthors: { some: { userId: user.id } } },
            { facultyAuthors: { some: { userId: user.id } } },
          ],
        },
      }),
      // Count FDPs
      prisma.fDP.count({ where: { userId: user.id } }),
      // Count unread notifications
      prisma.notification.count({
        where: { userId: user.id, read: false },
      }),
      // Recent submissions (last 5)
      prisma.journal.findMany({
        where: {
          OR: [
            { studentAuthors: { some: { userId: user.id } } },
            { facultyAuthors: { some: { userId: user.id } } },
          ],
        },
        select: {
          id: true,
          title: true,
          journalStatus: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    // Get status breakdown for journals
    const journalsByStatus = await prisma.journal.groupBy({
      by: ["journalStatus"],
      where: {
        OR: [
          { studentAuthors: { some: { userId: user.id } } },
          { facultyAuthors: { some: { userId: user.id } } },
        ],
      },
      _count: true,
    });

    const stats = {
      overview: {
        journals: journalsCount,
        bookChapters: bookChaptersCount,
        certificates: certificatesCount,
        achievements: achievementsCount,
        patents: patentsCount,
        copyrights: copyrightsCount,
        conferences: conferencesCount,
        grants: grantsCount,
        fdps: fdpsCount,
        totalResearch:
          journalsCount +
          bookChaptersCount +
          patentsCount +
          copyrightsCount +
          conferencesCount,
      },
      notifications: {
        unread: unreadNotifications,
      },
      journalsByStatus: Object.fromEntries(
        journalsByStatus.map((item) => [item.journalStatus, item._count])
      ),
      recentSubmissions,
    };

    return successResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
});
