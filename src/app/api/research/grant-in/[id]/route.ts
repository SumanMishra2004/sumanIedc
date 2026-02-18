import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { GrantInRole, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { GrantInPATCHRequestBodyData } from "@/types/grant-in";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    /* ----------------------------
       1. Auth Check
    ----------------------------- */
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    /* ----------------------------
       2. Role-Based Access Filter
    ----------------------------- */
    const whereClause: any = {
      id: id,
    };

    // FACULTY → must be in facultyAuthors
    if (userRole === UserRole.FACULTY) {
      whereClause.facultyAuthors = {
        some: {
          userId: userId,
        },
      };
    }

    // STUDENT → must be in studentAuthors
    if (userRole === UserRole.STUDENT) {
      whereClause.studentAuthors = {
        some: {
          userId: userId,
        },
      };
    }

    // ADMIN → no extra restriction

    /* ----------------------------
       3. Fetch Grant Securely
    ----------------------------- */
    const grant = await prisma.grantIn.findFirst({
      where: whereClause,
      include: {
        facultyAuthors: {
          include: {
            user: true,
          },
        },
        studentAuthors: {
          include: {
            user: true,
          },
        },
        bills: {
           include: {
             user: true
           }
        },
        publicationMappings: {
           include: {
             journal: true,
             conference: true,
             patent: true,
             bookChapter: true,
             copyright: true
           }
        }
      },
    });

    /* ----------------------------
       4. Not Found OR Forbidden
    ----------------------------- */
    if (!grant) {
      return NextResponse.json(
        {
          message:
            "Grant not found or you do not have permission to access it.",
        },
        { status: 404 }
      );
    }

    /* ----------------------------
       5. Success Response
    ----------------------------- */
    return NextResponse.json(
      {
        message: "GrantIn fetched successfully ✅",
        grant,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching grant-in:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    /* ----------------------------
       1. Auth Check
    ----------------------------- */
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    /* ----------------------------
       2. Students Cannot Update
    ----------------------------- */
    if (userRole === UserRole.STUDENT) {
      return NextResponse.json(
        { message: "Forbidden. Students cannot update grants." },
        { status: 403 }
      );
    }

    /* ----------------------------
       3. Parse Body
    ----------------------------- */
    const body = (await req.json()) as GrantInPATCHRequestBodyData;

    /* ----------------------------
       4. Fetch Existing Grant
    ----------------------------- */
    const existingGrant = await prisma.grantIn.findUnique({
      where: { id },
      include: {
        facultyAuthors: true,
      },
    });

    if (!existingGrant) {
      return NextResponse.json(
        { message: "Grant not found." },
        { status: 404 }
      );
    }

    /* ----------------------------
       5. Faculty Must be PI/CoPI
    ----------------------------- */
    if (userRole === UserRole.FACULTY) {
      const facultyEntry = existingGrant.facultyAuthors.find(
        (fa) => fa.userId === userId
      );

      if (
        !facultyEntry ||
        (facultyEntry.role !== GrantInRole.FACULTY_PI &&
          facultyEntry.role !== GrantInRole.FACULTY_COPI)
      ) {
        return NextResponse.json(
          { message: "Only PI or CoPI can update this Grant." },
          { status: 403 }
        );
      }
    }

    /* ----------------------------
       6. If Authors Updated → Must Keep PI
    ----------------------------- */
    if (body.facultyAuthors) {
      const hasPI = body.facultyAuthors.some(
        (f: any) => f.role === GrantInRole.FACULTY_PI
      );

      if (!hasPI) {
        return NextResponse.json(
          { message: "At least one Faculty PI must remain." },
          { status: 400 }
        );
      }

      // Prevent removing yourself as PI
      const selfEntry = body.facultyAuthors.find(
        (f: any) => f.userId === userId
      );

      if (!selfEntry) {
        return NextResponse.json(
          { message: "PI/CoPI cannot remove themselves from authors." },
          { status: 400 }
        );
      }
    }

    /* ----------------------------
       7. Update Grant
    ----------------------------- */
    const updatedGrant = await prisma.grantIn.update({
      where: { id },
      data: {
        projectCode: body.projectCode,
        grantInStatus: body.grantInStatus,
        durationOfProject: body.durationOfProject,

        amountGranted: body.amountGranted,
        usedAmount: body.usedAmount,

        grantDate: body.grantDate ? new Date(body.grantDate) : undefined,

        /* ----------------------------
           Authors Update Allowed for PI
        ----------------------------- */
        ...(body.facultyAuthors && {
          facultyAuthors: {
            deleteMany: {},
            create: body.facultyAuthors.map((f: any) => ({
              userId: f.userId,
              role: f.role,
            })),
          },
        }),

        ...(body.studentAuthors && {
          studentAuthors: {
            deleteMany: {},
            create: body.studentAuthors.map((s: any) => ({
              userId: s.userId,
            })),
          },
        }),
      },
      include: {
        facultyAuthors: true,
        studentAuthors: true,
      },
    });

    return NextResponse.json(
      {
        message: "Grant Updated Successfully ✅",
        grant: updatedGrant,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
