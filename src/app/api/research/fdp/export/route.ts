
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Export FDPs to CSV
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userRole = session.user.role;
    if (userRole !== "FACULTY" && userRole !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search");
    const targetUserId = searchParams.get("userId");

    const where: any = {};
    const userId = session.user.id;

    if (userRole === "ADMIN") {
        if (targetUserId) where.userId = targetUserId;
    } else {
        where.userId = userId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { topic: { contains: search, mode: "insensitive" } },
        { organizedBy: { contains: search, mode: "insensitive" } },
        { remark: { contains: search, mode: "insensitive" } },
        { keywords: { has: search } }
      ];
    }

    const fdps = await prisma.fDP.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const headers = [
      "ID",
      "Title",
      "Description",
      "Organized By",
      "Start Date",
      "End Date",
      "Topic",
      "Duration",
      "Remark",
      "Keywords",
      "User Name",
      "User Email",
      "Created At",
      "Updated At"
    ];

    const csvRows = [
      headers.join(","),
      ...fdps.map((fdp) => {
        return [
          fdp.id,
          `"${(fdp.title || "").replace(/"/g, '""')}"`,
          `"${(fdp.description || "").replace(/"/g, '""')}"`,
          `"${(fdp.organizedBy || "").replace(/"/g, '""')}"`,
          fdp.startDate ? new Date(fdp.startDate).toISOString() : "",
          fdp.endDate ? new Date(fdp.endDate).toISOString() : "",
          `"${(fdp.topic || "").replace(/"/g, '""')}"`,
          `"${(fdp.duration || "").replace(/"/g, '""')}"`,
          `"${(fdp.remark || "").replace(/"/g, '""')}"`,
          `"${(fdp.keywords || []).join("; ")}"`,
          `"${(fdp.user.name || "").replace(/"/g, '""')}"`,
          fdp.user.email || "",
          new Date(fdp.createdAt).toISOString(),
          new Date(fdp.updatedAt).toISOString()
        ].join(",");
      }),
    ];

    const csv = csvRows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="fdp-records-${new Date().toISOString()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting FDPs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
