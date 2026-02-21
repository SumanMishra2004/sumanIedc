import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ grants: [] });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    const whereClause: Record<string, unknown> = {};

    if (userRole === UserRole.FACULTY) {
      whereClause.facultyAuthors = { some: { userId } };
    } else if (userRole === UserRole.STUDENT) {
      whereClause.studentAuthors = { some: { userId } };
    }
    // ADMIN sees all

    const grants = await prisma.grantIn.findMany({
      where: whereClause,
      select: {
        id: true,
        projectCode: true,
        grantInStatus: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ grants });
  } catch (error) {
    console.error("Sidebar grants fetch error:", error);
    return NextResponse.json({ grants: [] });
  }
}
