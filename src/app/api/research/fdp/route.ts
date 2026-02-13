
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

// GET - List all FDPs
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    // FDP is strictly for Faculty and Admin
    if (!session?.user || (session.user.role !== "FACULTY" && session.user.role !== "ADMIN")) {
         return NextResponse.json(
            { error: "Unauthorized: only Faculty and Admins can access FDP records" },
            { status: 403 }
        );
    }
    
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const search = searchParams.get("search");

    const where: any = {};
    const userId = session.user.id;
    
    // Admin can see all, Faculty only see their own
    if (session.user.role !== "ADMIN") {
        where.userId = userId;
    } else {
        // Admin: filtering by specific user
        const targetUserId = searchParams.get("userId");
        if (targetUserId) {
            where.userId = targetUserId;
        }
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

    const [fdps, total] = await Promise.all([
      prisma.fDP.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      }),
      prisma.fDP.count({ where }),
    ]);

    return NextResponse.json({
      fdps,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching FDPs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new FDP
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Check auth and role
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "FACULTY" && session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Only Faculty can create FDP records" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      keywords,
      organizedBy,
      startDate,
      endDate,
      topic,
      duration,
      remark,
    } = body;

    if (!title || !startDate || !endDate) {
        return NextResponse.json(
            { error: "Title, Start Date and End Date are required" },
            { status: 400 }
        );
    }

    const fdp = await prisma.fDP.create({
      data: {
        title,
        description,
        keywords: keywords || [],
        organizedBy,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        topic,
        duration,
        remark,
        userId: session.user.id,
      },
    });

    return NextResponse.json(fdp, { status: 201 });
  } catch (error) {
    console.error("Error creating FDP:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
