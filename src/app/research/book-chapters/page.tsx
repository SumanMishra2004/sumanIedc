import prisma from "@/lib/prisma";
import BookChapterClient from "./BookChapterClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Chapters | IEDC Research Lab",
  description: "Browse the published book chapters, research compilation contributions, and textbooks co-authored by student and faculty writers at IEDC CSE.",
};

export default async function BookChaptersPage() {
  const dbChapters = await prisma.bookChapter.findMany({
    where: { isPublic: true },
    include: {
      studentAuthors: { include: { user: true } },
      facultyAuthors: { include: { user: true } },
    },
    orderBy: { publicationDate: "desc" },
  });

  const formattedChapters = dbChapters.map((c) => {
    const authors = [
      ...c.facultyAuthors.map((fa) => ({
        name: fa.user.name || fa.user.email || "Faculty Author",
        role: "Faculty",
      })),
      ...c.studentAuthors.map((sa) => ({
        name: sa.user.name || sa.user.email || "Student Author",
        role: "Student",
      })),
    ];

    return {
      id: c.id,
      title: c.title,
      bookChapterStatus: c.bookChapterStatus,
      isbnIssn: c.isbnIssn,
      publisher: c.publisher,
      publicationDate: c.publicationDate ? c.publicationDate.toISOString() : null,
      doi: c.doi,
      paperLink: c.documentUrl,
      abstract: c.abstract,
      keywords: c.keywords,
      authors,
    };
  });

  return <BookChapterClient initialChapters={formattedChapters} />;
}
