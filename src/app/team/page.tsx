import prisma from "@/lib/prisma";
import TeamClient from "./TeamClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Team | IEDC Research Lab",
  description: "Meet the coordinators, mentors, academic advisors, and student leads driving innovation, entrepreneurship, and scientific research at IEDC CSE.",
};

export default async function TeamPage() {
  const dbFaculty = await prisma.user.findMany({
    where: {
      role: { in: ["FACULTY", "ADMIN"] },
      profileCompleted: true,
    },
    select: {
      name: true,
      email: true,
      image: true,
      role: true,
      designation: true,
      department: true,
      areasOfExpertise: true,
      linkedinLink: true,
      githubLink: true,
    },
  });

  const formattedFaculty = dbFaculty.map((f) => ({
    name: f.name || f.email || "Faculty Advisor",
    email: f.email,
    image: f.image,
    role: f.role,
    designation: f.designation,
    department: f.department,
    areasOfExpertise: f.areasOfExpertise,
    linkedinLink: f.linkedinLink,
    githubLink: f.githubLink,
  }));

  return <TeamClient dbFaculty={formattedFaculty} />;
}
