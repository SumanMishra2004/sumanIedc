import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getJournalQueryFilter } from "@/lib/research/journalHelpers";
import JournalTable from "@/components/journal/JournalTable";

/**
 * Server component — fetches first page of journals at request time so
 * JournalTable renders immediately with data (no client-side loading flash).
 */
export default async function JournalPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { id: userId, role: userRole } = session.user;
  const where = getJournalQueryFilter(userId, userRole ?? "STUDENT");

  const [journals, total] = await Promise.all([
    prisma.journal.findMany({
      where,
      take: 10,
      skip: 0,
      orderBy: { createdAt: "desc" },
      include: {
        studentAuthors: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true, department: true } },
          },
        },
        facultyAuthors: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true, department: true } },
          },
        },
      },
    }),
    prisma.journal.count({ where }),
  ]);

  return (
    <div className="w-full h-full p-4 md:p-6 lg:p-8 flex flex-col gap-6">
      <JournalTable
        // Pass SSR data so the table renders instantly
        initialData={journals as any}
        initialTotal={total}
        session={session}
      />
    </div>
  );
}
