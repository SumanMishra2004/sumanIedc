
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";


// GET - Export certificates to CSV
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search");
    const isPublic = searchParams.get("isPublic"); 
    const targetUserId = searchParams.get("userId");

    // Build where clause
    const where: any = {};
    const userId = session.user.id;
    const userRole = session.user.role;

    if (userRole === "ADMIN") {
        if (targetUserId) where.userId = targetUserId;
        if (isPublic !== null && isPublic !== undefined) where.isPublic = isPublic === "true";
    } else {
        // Regular user export logic
        // 1. Export MY certificates
        // 2. Or export visible public certificates?
        // Usually "Export" implies exporting data I care about or manage. 
        // Let's assume matches the List API logic: My Certs + Public Certs?
        // Or strictly MY certs? 
        // Let's stick to the List API logic for consistency.
        
        if (targetUserId && targetUserId !== userId) {
             where.userId = targetUserId;
             where.isPublic = true;
        } else {
            where.userId = userId;
        }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { offeredBy: { contains: search, mode: "insensitive" } },
        { remark: { contains: search, mode: "insensitive" } },
        { keywords: { has: search } }
      ];
    }

    const certificates = await prisma.certificate.findMany({
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

    // Generate CSV content
    const headers = [
      "ID",
      "Title",
      "Description",
      "Offered By",
      "Date of Completion",
      "Keywords",
      "Remark",
      "Is Public",
      "Document URL",
      "User Name",
      "User Email",
      "Created At",
      "Updated At"
    ];

    const csvRows = [
      headers.join(","),
      ...certificates.map((cert) => {
        return [
          cert.id,
          `"${(cert.title || "").replace(/"/g, '""')}"`,
          `"${(cert.description || "").replace(/"/g, '""')}"`,
          `"${(cert.offeredBy || "").replace(/"/g, '""')}"`,
          cert.dateOfCompletion ? new Date(cert.dateOfCompletion).toISOString() : "",
          `"${(cert.keywords || []).join("; ")}"`,
          `"${(cert.remark || "").replace(/"/g, '""')}"`,
          cert.isPublic,
          cert.documentUrl || "",
          `"${(cert.user.name || "").replace(/"/g, '""')}"`,
          cert.user.email || "",
          new Date(cert.createdAt).toISOString(),
          new Date(cert.updatedAt).toISOString()
        ].join(",");
      }),
    ];

    const csv = csvRows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="certificates-${new Date().toISOString()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting certificates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
