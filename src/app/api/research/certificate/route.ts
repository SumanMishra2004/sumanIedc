import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole, CertificateStatus } from "@prisma/client";
import { certificateSchema } from "@/lib/validations/certificate";

// GET - List all certificates with filtering, search, and pagination
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const search = searchParams.get("search");
    const isPublic = searchParams.get("isPublic"); 
    const certificateStatus = searchParams.get("certificateStatus");
    const offeredBy = searchParams.get("offeredBy");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const targetUserId = searchParams.get("userId");

    const where: any = {};

    // Determine scope based on user role and authentication
    if (!session?.user) {
      // Unauthenticated users can only see public certificates
      where.isPublic = true;
    } else {
      const userRole = session.user.role as UserRole;
      const userId = session.user.id;

      if (userRole === "ADMIN") {
        // Admins can see everything
        if (targetUserId) {
          where.userId = targetUserId;
        }
      } else {
        // Regular users see their own certificates (implicit default)
        // or someone else's public certificates if targetUserId is specified
        if (targetUserId && targetUserId !== userId) {
          where.userId = targetUserId;
          where.isPublic = true;
        } else {
          where.userId = userId;
        }
      }
    }

    // Apply filters
    if (isPublic !== null && isPublic !== undefined && isPublic !== "") {
      where.isPublic = isPublic === "true";
    }

    if (certificateStatus) {
      where.certificateStatus = certificateStatus as CertificateStatus;
    }

    if (offeredBy) {
      where.offeredBy = { contains: offeredBy, mode: "insensitive" };
    }

    if (startDate || endDate) {
      where.dateOfCompletion = {};
      if (startDate) {
        where.dateOfCompletion.gte = new Date(startDate);
      }
      if (endDate) {
        where.dateOfCompletion.lte = new Date(endDate);
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

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
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

    // Validate using Zod schema
    const validation = certificateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message, details: validation.error.issues },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      keywords,
      documentUrl,
      offeredBy,
      dateOfCompletion,
      remark,
      isPublic,
      certificateStatus,
    } = validation.data;

    const certificate = await prisma.certificate.create({
      data: {
        title,
        description,
        keywords: keywords || [],
        documentUrl,
        offeredBy,
        dateOfCompletion: new Date(dateOfCompletion),
        remark,
        isPublic: isPublic ?? true,
        certificateStatus: certificateStatus ?? CertificateStatus.SUBMITTED,
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

// DELETE - Bulk delete certificates (supporting admin action)
export async function DELETE(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role === UserRole.STUDENT) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin or Faculty access required' },
        { status: 403 }
      )
    }

    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs array is required' },
        { status: 400 }
      )
    }

    const result = await prisma.certificate.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    return NextResponse.json({
      message: `Successfully deleted ${result.count} certificate(s)`,
      count: result.count
    })
  } catch (error) {
    console.error('Error deleting certificates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
