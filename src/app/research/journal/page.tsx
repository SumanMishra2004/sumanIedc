import prisma from "@/lib/prisma";
import JournalClient from "./JournalClient";
import { Metadata } from "next";

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: "Journal Publications | IEDC Research Lab",
  description: "Explore the international peer-reviewed journal articles, impact factors, indexing and research studies published by the faculty and student innovators of IEDC Cell.",
};

export default async function JournalPage() {
  const dbJournals = await prisma.journal.findMany({
    where: { isPublic: true },
    include: {
      studentAuthors: { include: { user: true } },
      facultyAuthors: { include: { user: true } },
    },
    orderBy: { publicationDate: "desc" },
  });

  const formattedJournals = dbJournals.map((j) => {
    const authors = [
      ...j.facultyAuthors.map((fa) => ({
        name: fa.user?.name || fa.user?.email || "Faculty Author",
        role: "Faculty",
      })),
      ...j.studentAuthors.map((sa) => ({
        name: sa.user.name || sa.user.email || "Student Author",
        role: "Student",
      })),
    ];

    return {
      id: j.id,
      title: j.title,
      journalName: j.journalName,
      indexing: j.indexing,
      quartile: j.quartile,
      impactFactor: j.impactFactor,
      doi: j.doi,
      paperLink: j.paperLink,
      publicationDate: j.publicationDate ? j.publicationDate.toISOString() : null,
      scope: j.scope,
      abstract: j.abstract,
      keywords: j.keywords,
      authors,
    };
  });

  return <JournalClient initialJournals={formattedJournals} />;
}
