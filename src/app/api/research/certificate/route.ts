
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

// GET - List all certificates
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    // Allow public access to view public certificates, but personal ones require auth
    
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const search = searchParams.get("search");
    const isPublic = searchParams.get("isPublic"); 

    const where: any = {};

    // Determine scope based on user role and authentication
    if (!session?.user) {
      // Unauthenticated users can only see public certificates
      where.isPublic = true;
    } else {
      const userRole = session.user.role as UserRole;
      const userId = session.user.id;

      if (userRole === "ADMIN") {
        // Admins can see everything, apply filters if present
        if (isPublic !== null && isPublic !== undefined) {
          where.isPublic = isPublic === "true";
        }
      } else {
        // Regular users (Student/Faculty) see their own certificates OR public ones
        // If they want to see "my certificates", they filter by their ID implicitly? 
        // Or we just return mixed list? 
        // Usually, a "My Certificates" page would call this. 
        // Let's assume the default view for a logged-in user is 'their own' + 'public' 
        // OR we can strictly scope it to their own if they are managing them.
        // Let's follow the pattern: Users primarily manage THEIR data. Public data is for profile viewing.
        // If query param `userId` is provided (e.g. viewing a profile), we respect that (if public or admin).
        
        // Simple approach:
        // By default, return the user's own certificates.
        // If `userId` param is passed (viewing someone else), return that user's PUBLIC certificates.
        
        const targetUserId = searchParams.get("userId");
        
        if (targetUserId && targetUserId !== userId) {
             // Viewing someone else
             where.userId = targetUserId;
             where.isPublic = true; // Strict public only
        } else {
            // Viewing my own or no specific target
            // Show my own
            where.userId = userId;
        }
      }
    }
    
    // Explicit override if filtering by specific user ID from client side (useful for admins too)
    if (searchParams.get("userId") && session?.user.role === "ADMIN") {
        where.userId = searchParams.get("userId");
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

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }, // Most recent first
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
      prisma.certificate.count({ where }),
    ]);

    return NextResponse.json({
      certificates,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new certificate
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      keywords,
      documentUrl,
      offeredBy,
      dateOfCompletion,
      remark,
      isPublic,
    } = body;

    // Validation
    if (!title || !dateOfCompletion) {
        return NextResponse.json(
            { error: "Title and Date of Completion are required" },
            { status: 400 }
        );
    }

    const certificate = await prisma.certificate.create({
      data: {
        title,
        description, // Optional
        keywords: keywords || [], // Optional
        documentUrl, // Optional
        offeredBy, // Optional
        dateOfCompletion: new Date(dateOfCompletion),
        remark, // Optional
        isPublic: isPublic ?? true, // Default true as per schema or false? Schema says @default(true)
        userId: session.user.id,
      },
    });

    return NextResponse.json(certificate, { status: 201 });
  } catch (error) {
    console.error("Error creating certificate:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
