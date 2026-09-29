import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/public/stats — public research statistics for landing page
export async function GET(_req: NextRequest) {
  try {
    const [journals, bookChapters, conferences, patents, copyrights, achievements, events, faculty, students] =
      await Promise.all([
        prisma.journal.count({ where: { isPublic: true, journalStatus: { in: ["APPROVED","PUBLISHED"] } } }),
        prisma.bookChapter.count({ where: { isPublic: true, bookChapterStatus: { in: ["APPROVED","PUBLISHED"] } } }),
        prisma.conference.count({ where: { isPublic: true, conferenceStatus: { in: ["APPROVED","PRESENTED","PUBLISHED"] } } }),
        prisma.patent.count({ where: { isPublic: true, patentStatus: { in: ["APPROVED","GRANTED"] } } }),
        prisma.copyright.count({ where: { isPublic: true, copyrightStatus: { in: ["APPROVED","PUBLISHED"] } } }),
        prisma.achievement.count({ where: { isPublic: true, achievementStatus: "APPROVED" } }),
        prisma.event.count({ where: { eventStatus: "PUBLISHED" } }),
        prisma.user.count({ where: { role: "FACULTY", isActive: true, deletedAt: null } }),
        prisma.user.count({ where: { role: "STUDENT", isActive: true, deletedAt: null } }),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        research: { journals, bookChapters, conferences, patents, copyrights,
          total: journals + bookChapters + conferences + patents + copyrights },
        community: { faculty, students, total: faculty + students },
        other:     { achievements, events },
      },
    });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
