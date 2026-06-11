import prisma from "@/lib/prisma";
import CopyrightClient from "./CopyrightClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Software Copyrights | IEDC Research Lab",
  description: "Browse the registered software codebases, utility algorithms, and database designs copyrighted by student developers and faculty of IEDC CSE.",
};

export default async function CopyrightPage() {
  const dbCopyrights = await prisma.copyright.findMany({
    where: { isPublic: true },
    include: {
      studentAuthors: { include: { user: true } },
      facultyAuthors: { include: { user: true } },
    },
    orderBy: { dateOfFiling: "desc" },
  });

  const formattedCopyrights = dbCopyrights.map((c) => {
    const authors = [
      ...c.facultyAuthors.map((fa) => ({
        name: fa.user.name || fa.user.email || "Faculty Creator",
        role: "Faculty",
      })),
      ...c.studentAuthors.map((sa) => ({
        name: sa.user.name || sa.user.email || "Student Creator",
        role: "Student",
      })),
    ];

    return {
      id: c.id,
      title: c.title,
      regNo: c.regNo,
      copyrightStatus: c.copyrightStatus,
      dateOfFiling: c.dateOfFiling ? c.dateOfFiling.toISOString() : null,
      dateOfGrant: c.dateOfGrant ? c.dateOfGrant.toISOString() : null,
      abstract: c.abstract,
      authors,
    };
  });

  return <CopyrightClient initialCopyrights={formattedCopyrights} />;
}
