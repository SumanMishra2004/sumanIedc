import prisma from "@/lib/prisma";
import PatentClient from "./PatentClient";
import { Metadata } from "next";

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: "Patents & IP | IEDC Research Lab",
  description: "Browse the utility and design patents, technology disclosures, and industrial designs registered by student and faculty inventors at the IEDC.",
};

export default async function PatentPage() {
  const dbPatents = await prisma.patent.findMany({
    where: { isPublic: true },
    include: {
      studentAuthors: { include: { user: true } },
      facultyAuthors: { include: { user: true } },
    },
    orderBy: { filingDate: "desc" },
  });

  const formattedPatents = dbPatents.map((p) => {
    const inventors = [
      ...p.facultyAuthors.map((fa) => ({
        name: fa.user?.name || fa.user?.email || "Faculty Inventor",
        role: "Faculty",
      })),
      ...p.studentAuthors.map((sa) => ({
        name: sa.user.name || sa.user.email || "Student Inventor",
        role: "Student",
      })),
    ];

    return {
      id: p.id,
      title: p.title,
      patentStatus: p.patentStatus,
      applicationNo: p.applicationNo,
      grantedPatentNo: p.grantedPatentNo,
      filingDate: p.filingDate ? p.filingDate.toISOString() : null,
      grantDate: p.grantDate ? p.grantDate.toISOString() : null,
      patentLink: p.patentLink,
      abstract: p.abstract,
      keywords: p.keywords,
      inventors,
    };
  });

  return <PatentClient initialPatents={formattedPatents} />;
}
