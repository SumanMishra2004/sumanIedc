import prisma from "@/lib/prisma";
import ConferenceClient from "./ConferenceClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conference Proceedings | IEDC Research Lab",
  description: "Browse the national and international academic conference papers, abstracts, and tech proceedings published by student and faculty developers at IEDC CSE.",
};

export default async function ConferencePage() {
  const dbConferences = await prisma.conference.findMany({
    where: { isPublic: true },
    include: {
      studentAuthors: { include: { user: true } },
      facultyAuthors: { include: { user: true } },
    },
    orderBy: { conferenceDate: "desc" },
  });

  const formattedConferences = dbConferences.map((c) => {
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
      conferenceName: c.conferenceName,
      paperName: c.paperName || "Research Paper",
      mode: c.mode,
      conferenceDate: c.conferenceDate ? c.conferenceDate.toISOString() : null,
      paperLink: c.paperLink,
      abstract: c.abstract,
      keywords: c.keywords,
      authors,
    };
  });

  return <ConferenceClient initialConferences={formattedConferences} />;
}
