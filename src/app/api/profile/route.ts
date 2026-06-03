import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId") || session.user.id;
    const isOwnProfile = targetUserId === session.user.id;

    // Fetch target user info
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true, name: true, email: true, image: true, bio: true, department: true, phone: true, role: true, profileCompleted: true,
        coverImage: true, institution: true, linkedinLink: true, skills: true,
        enrollmentNo: true, degree: true, currentYear: true, currentSemester: true, graduationYear: true,
        resumeLink: true, portfolioLink: true, githubLink: true, researchInterests: true,
        designation: true, yearsOfExperience: true, areasOfExpertise: true, orcidId: true
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // For other profiles, only show public items; for own profile show all
    const authorFilter = (relation: "facultyAuthors" | "studentAuthors") => ({
      [relation]: { some: { userId: targetUserId } },
    });

    const publicFilter = isOwnProfile ? {} : { isPublic: true };

    const studentOrFacultyFilter = {
      OR: [
        { studentAuthors: { some: { userId: targetUserId } } },
        { facultyAuthors: { some: { userId: targetUserId } } },
      ],
    };

    // Fetch all research in parallel
    const [
      journals,
      bookChapters,
      conferences,
      patents,
      copyrights,
      certificates,
      fdps,
    ] = await Promise.all([
      // Journals
      prisma.journal.findMany({
        where: { ...publicFilter, ...studentOrFacultyFilter },
        select: {
          id: true,
          title: true,
          journalName: true,
          abstract: true,
          keywords: true,
          doi: true,
          paperLink: true,
          publicationDate: true,
          journalStatus: true,
          isPublic: true,
          scope: true,
          indexing: true,
          quartile: true,
          impactFactor: true,
          publisher: true,
          imageUrl: true,
          createdAt: true,
          studentAuthors: { include: { user: { select: { id: true, name: true, image: true } } } },
          facultyAuthors: { include: { user: { select: { id: true, name: true, image: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),

      // Book Chapters
      prisma.bookChapter.findMany({
        where: { ...publicFilter, ...studentOrFacultyFilter },
        select: {
          id: true,
          title: true,
          abstract: true,
          keywords: true,
          doi: true,
          publisher: true,
          publicationDate: true,
          bookChapterStatus: true,
          isPublic: true,
          imageUrl: true,
          isbnIssn: true,
          createdAt: true,
          studentAuthors: { include: { user: { select: { id: true, name: true, image: true } } } },
          facultyAuthors: { include: { user: { select: { id: true, name: true, image: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),

      // Conferences
      prisma.conference.findMany({
        where: { ...publicFilter, ...studentOrFacultyFilter },
        select: {
          id: true,
          conferenceName: true,
          abstract: true,
          keywords: true,
          paperDoi: true,
          paperLink: true,
          paperName: true,
          conferenceDate: true,
          conferenceStatus: true,
          conferencePublisher: true,
          mode: true,
          isPublic: true,
          imageUrl: true,
          createdAt: true,
          studentAuthors: { include: { user: { select: { id: true, name: true, image: true } } } },
          facultyAuthors: { include: { user: { select: { id: true, name: true, image: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),

      // Patents
      prisma.patent.findMany({
        where: { ...publicFilter, ...studentOrFacultyFilter },
        select: {
          id: true,
          title: true,
          abstract: true,
          keywords: true,
          grantedPatentNo: true,
          applicationNo: true,
          filingDate: true,
          grantDate: true,
          publicationDate: true,
          patentStatus: true,
          patentLink: true,
          isPublic: true,
          imageUrl: true,
          createdAt: true,
          studentAuthors: { include: { user: { select: { id: true, name: true, image: true } } } },
          facultyAuthors: { include: { user: { select: { id: true, name: true, image: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),

      // Copyrights
      prisma.copyright.findMany({
        where: { ...publicFilter, ...studentOrFacultyFilter },
        select: {
          id: true,
          title: true,
          abstract: true,
          regNo: true,
          dateOfFiling: true,
          dateOfGrant: true,
          dateOfPublished: true,
          copyrightStatus: true,
          isPublic: true,
          imageUrl: true,
          createdAt: true,
          studentAuthors: { include: { user: { select: { id: true, name: true, image: true } } } },
          facultyAuthors: { include: { user: { select: { id: true, name: true, image: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),

      // Certificates (only for own profile or if isPublic)
      prisma.certificate.findMany({
        where: {
          userId: targetUserId,
          ...(isOwnProfile ? {} : { isPublic: true }),
        },
        select: {
          id: true,
          title: true,
          description: true,
          keywords: true,
          offeredBy: true,
          dateOfCompletion: true,
          isPublic: true,
          documentUrl: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),

      // FDP (only for own profile or public)
      prisma.fDP.findMany({
        where: { userId: targetUserId },
        select: {
          id: true,
          title: true,
          description: true,
          keywords: true,
          organizedBy: true,
          startDate: true,
          endDate: true,
          topic: true,
          duration: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const stats = {
      total:
        journals.length +
        bookChapters.length +
        conferences.length +
        patents.length +
        copyrights.length +
        certificates.length +
        fdps.length,
      journals: journals.length,
      bookChapters: bookChapters.length,
      conferences: conferences.length,
      patents: patents.length,
      copyrights: copyrights.length,
      certificates: certificates.length,
      fdps: fdps.length,
    };

    return NextResponse.json({
      success: true,
      user,
      isOwnProfile,
      stats,
      research: {
        journals,
        bookChapters,
        conferences,
        patents,
        copyrights,
        certificates,
        fdps,
      },
    });
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
