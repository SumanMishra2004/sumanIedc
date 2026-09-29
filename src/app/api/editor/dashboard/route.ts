import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/auth/guard";

// GET /api/editor/dashboard - editor review queue overview
export async function GET(req: NextRequest) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;

  try {
    const [
      journalsPending,
      bookChaptersPending,
      conferencesPending,
      patentsPending,
      copyrightsPending,
      achievementsPending,
      certificatesPending,
      fdpsPending,
      eventsDraft,
      verificationsPending,
      journalsApproved,
      recentJournals,
    ] = await Promise.all([
      prisma.journal.count({ where: { teacherStatus: "UPLOADED" } }),
      prisma.bookChapter.count({ where: { teacherStatus: "UPLOADED" } }),
      prisma.conference.count({ where: { teacherStatus: "UPLOADED" } }),
      prisma.patent.count({ where: { teacherStatus: "UPLOADED" } }),
      prisma.copyright.count({ where: { teacherStatus: "UPLOADED" } }),
      prisma.achievement.count({ where: { achievementStatus: "SUBMITTED" } }),
      prisma.certificate.count({ where: { certificateStatus: "SUBMITTED" } }),
      prisma.fDP.count({ where: { fdpStatus: "SUBMITTED" } }),
      prisma.event.count({ where: { eventStatus: "DRAFT" } }),
      prisma.facultyVerificationRequest.count({ where: { status: "PENDING" } }),
      prisma.journal.count({ where: { teacherStatus: "ACCEPTED" } }),
      prisma.journal.findMany({
        where: { teacherStatus: "UPLOADED" },
        select: { id: true, title: true, journalName: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        pendingReview: {
          journals: journalsPending,
          bookChapters: bookChaptersPending,
          conferences: conferencesPending,
          patents: patentsPending,
          copyrights: copyrightsPending,
          achievements: achievementsPending,
          certificates: certificatesPending,
          fdps: fdpsPending,
          total: journalsPending + bookChaptersPending + conferencesPending +
                 patentsPending + copyrightsPending,
        },
        events: { draft: eventsDraft },
        verifications: { pending: verificationsPending },
        approved: { journals: journalsApproved },
        recentPendingJournals: recentJournals,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
