import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { GrantInRole, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { GrantInPATCHRequestBodyData } from "@/types/grant-in";
import { storage } from "@/lib/appwrite";
import { notifyGrantStatusUpdated } from "@/lib/research/grantNotifications";

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

    // ADMIN → must not be hidden
    if (userRole === UserRole.ADMIN) {
      whereClause.hideFromAdmin = false;
    }

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
       5. Faculty Must be PI/CoPI / Admin Restrictions
    ----------------------------- */
    if (userRole === UserRole.ADMIN) {
      if (existingGrant.hideFromAdmin) {
        return NextResponse.json(
          { message: "Grant not found." },
          { status: 404 }
        );
      }
      if (!existingGrant.isPublic) {
        return NextResponse.json(
          { message: "Forbidden. Admin can only edit public grants." },
          { status: 403 }
        );
      }
    }

    if (userRole === UserRole.ADMIN && body.hideFromAdmin !== undefined && body.hideFromAdmin !== existingGrant.hideFromAdmin) {
      return NextResponse.json(
        { message: "Forbidden. Admin cannot change hideFromAdmin visibility." },
        { status: 403 }
      );
    }

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

      // Prevent removing yourself as PI (only for Faculty)
      if (userRole === UserRole.FACULTY) {
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
    }

    /* ----------------------------
       7. Amount Safety Validation
    ----------------------------- */
    const resolvedAmount = body.amountGranted ?? existingGrant.amountGranted
    const resolvedUsed   = body.usedAmount   ?? existingGrant.usedAmount

    if (resolvedAmount !== null && resolvedAmount < 0) {
      return NextResponse.json(
        { message: "amountGranted cannot be negative." },
        { status: 400 }
      )
    }
    if (resolvedUsed !== null && resolvedUsed < 0) {
      return NextResponse.json(
        { message: "usedAmount cannot be negative." },
        { status: 400 }
      )
    }
    if (
      resolvedAmount !== null &&
      resolvedUsed   !== null &&
      resolvedUsed > resolvedAmount
    ) {
      return NextResponse.json(
        { message: "usedAmount cannot exceed amountGranted." },
        { status: 400 }
      )
    }

    /* ----------------------------
       8. Update Grant
    ----------------------------- */
    const updatedGrant = await prisma.grantIn.update({
      where: { id },
      data: {
        projectCode: body.projectCode,
        grantInStatus: body.grantInStatus,
        durationOfProject: body.durationOfProject,
        applicationDate: body.applicationDate ? new Date(body.applicationDate) : undefined,

        amountGranted: body.amountGranted,
        usedAmount: body.usedAmount,
        hideFromAdmin: body.hideFromAdmin,

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

    // Trigger notification if status changed
    if (existingGrant.grantInStatus !== updatedGrant.grantInStatus) {
      await notifyGrantStatusUpdated(updatedGrant.id, existingGrant.grantInStatus, updatedGrant.grantInStatus);
    }

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




export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized. Please login." },
        { status: 401 },
      );
    }
    if(session.user.role === UserRole.STUDENT){
      return NextResponse.json(
        { message: "Forbidden. Student can't delete grants." },
        { status: 403 },
      );
    }
      const { id } = await params;
   
    const grantsToDelete = await prisma.grantIn.findMany({
      where: {
        id,
        ...(session.user.role === UserRole.ADMIN ? { hideFromAdmin: false } : {
          OR: [
            { facultyAuthors: { some: { userId: session.user.id } } },
            { studentAuthors: { some: { userId: session.user.id } } },
          ],
        }),

      },
      include: {
        facultyAuthors: true,
      },
    });
    if (grantsToDelete.length !== 1) {
      return NextResponse.json(
        { message: "Grant not found or you don't have permission to delete it." },
        { status: 404 },
      );
    }
    if (session.user.role === UserRole.FACULTY) {
      const allAllowed = grantsToDelete.every((grant) => {
        const facultyEntry = grant.facultyAuthors.find(
          (fa) => fa.userId === session.user.id,
        );

        return (
          facultyEntry &&
          (facultyEntry.role === GrantInRole.FACULTY_PI ||
            facultyEntry.role === GrantInRole.FACULTY_COPI)
        );
      });

      if (!allAllowed) {
        return NextResponse.json(
          {
            message:
              "Forbidden. Only PI or Co-PI can delete this Grant.",
          },
          { status: 403 },
        );
      }
    }

    // Admin automatically allowed

    /* ----------------------------
       6. Delete Grants
    ----------------------------- */
    // Fetch associated bills to delete files from Appwrite
    const bills = await prisma.grantInBill.findMany({
      where: { grantInId: id },
      select: { fileId: true }
    });

    const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;
    for (const bill of bills) {
      if (bill.fileId) {
        try {
          await storage.deleteFile(BUCKET_ID, bill.fileId);
        } catch (e) {
          console.error(`Failed to delete bill file ${bill.fileId} from Appwrite`, e);
        }
      }
    }

     await prisma.grantIn.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      {
        message: `Deleted grant successfully ✅`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GrantIn DELETE Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}