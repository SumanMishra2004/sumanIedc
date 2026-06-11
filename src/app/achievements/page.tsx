import prisma from "@/lib/prisma";
import AchievementsClient from "./AchievementsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cell Achievements | IEDC Research Lab",
  description: "Browse the national hackathon wins, research grants, start-up launch milestones and awards won by IEDC Computer Science & Engineering developers.",
};

export default async function AchievementsPage() {
  const dbAchievements = await prisma.achievement.findMany({
    where: { isPublic: true },
    include: { user: true },
    orderBy: { year: "desc" },
  });

  const formattedAchievements = dbAchievements.map((a) => {
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      category: a.category,
      year: a.year,
      imageUrl: a.imageUrl,
      documentUrl: a.documentUrl,
      earner: {
        name: a.user?.name || a.user?.email || "Innovator",
        email: a.user?.email || null,
        role: a.user?.role || "STUDENT"
      }
    };
  });

  return <AchievementsClient initialAchievements={formattedAchievements} />;
}
