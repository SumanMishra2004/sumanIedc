import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { GrantInRole, GrantInStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { GrantInPOSTRequestBodyData } from "@/types/grant-in";
import { revalidateTag } from "next/cache";

/* ----------------------------
   Request Body Interfaces
----------------------------- */
// Interfaces moved to @/types/grant-in.ts

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    console.log("GrantIn POST Session:", session);
    /* ----------------------------
       1. Auth Check
    ----------------------------- */
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Please login." },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    if (userRole === UserRole.STUDENT) {
  return NextResponse.json({ message: "Students cannot create grants." }, { status: 403 })
}
    /* ----------------------------
       2. Parse Body
    ----------------------------- */
    const body: GrantInPOSTRequestBodyData = await req.json();

    const {
      projectCode,
      applicationDate,
      grantDate,
      durationOfProject,
      amountGranted,
      usedAmount,
      isPublic,
      facultyAuthors,
      studentAuthors,
    } = body;

    /* ----------------------------
       3. Required Validation
    ----------------------------- */
    if (!applicationDate) {
      return NextResponse.json(
        { message: "applicationDate is required." },
        { status: 400 },
      );
    }

    if (!facultyAuthors || facultyAuthors.length === 0) {
      return NextResponse.json(
        { message: "At least one Faculty Author is required." },
        { status: 400 },
      );
    }

    /* ----------------------------
       4. Must Have One PI Always
    ----------------------------- */
    const hasPI = facultyAuthors.some((f) => f.role === GrantInRole.FACULTY_PI);

    if (!hasPI) {
      return NextResponse.json(
        { message: "At least one Faculty PI is compulsory." },
        { status: 400 },
      );
    }

    /* ----------------------------
       5. FACULTY User Rule:
          Faculty must be PI or CoPI
    ----------------------------- */
    if (userRole === UserRole.FACULTY) {
      const sessionFacultyEntry = facultyAuthors.find(
        (f) => f.teacherId === userId,
      );

      if (!sessionFacultyEntry) {
        return NextResponse.json(
          {
            message:
              "Faculty creating the grant must be included as PI or Co-PI.",
          },
          { status: 403 },
        );
      }

      if (
        sessionFacultyEntry.role !== GrantInRole.FACULTY_PI &&
        sessionFacultyEntry.role !== GrantInRole.FACULTY_COPI
      ) {
        return NextResponse.json(
          {
            message:
              "Faculty creator must have role FACULTY_PI or FACULTY_COPI.",
          },
          { status: 403 },
        );
      }
    }

    /* ----------------------------
       6. ADMIN Rule:
          Admin must assign a faculty PI
    ----------------------------- */
    if (userRole === UserRole.ADMIN) {
      const piFaculty = facultyAuthors.find(
        (f) => f.role === GrantInRole.FACULTY_PI,
      );

      if (!piFaculty) {
        return NextResponse.json(
          {
            message:
              "Admin must compulsorily assign one Faculty PI to create GrantIn.",
          },
          { status: 400 },
        );
      }
    }

    /* ----------------------------
       7. Date Validation
    ----------------------------- */
    const appDate = new Date(applicationDate);
    if (isNaN(appDate.getTime())) {
      return NextResponse.json(
        { message: "Invalid applicationDate format." },
        { status: 400 },
      );
    }

    const grantDateParsed = grantDate ? new Date(grantDate) : null;
    if (grantDate && isNaN(grantDateParsed!.getTime())) {
      return NextResponse.json(
        { message: "Invalid grantDate format." },
        { status: 400 },
      );
    }

    /* ----------------------------
       8. Amount Safety
    ----------------------------- */
    if (amountGranted && amountGranted < 0)
      return NextResponse.json(
        { message: "amountGranted cannot be negative." },
        { status: 400 },
      );

    if (usedAmount && usedAmount < 0)
      return NextResponse.json(
        { message: "usedAmount cannot be negative." },
        { status: 400 },
      );

    if (amountGranted && usedAmount && usedAmount > amountGranted)
      return NextResponse.json(
        { message: "usedAmount cannot exceed amountGranted." },
        { status: 400 },
      );

    /* ----------------------------
       9. Duplicate Prevention
    ----------------------------- */
    const facultyIds = facultyAuthors.map((f) => f.teacherId);
    if (new Set(facultyIds).size !== facultyIds.length) {
      return NextResponse.json(
        { message: "Duplicate Faculty Authors detected." },
        { status: 400 },
      );
    }

    /* ----------------------------
       10. Faculty Existence Check
    ----------------------------- */
    const facultyUsers = await prisma.user.findMany({
      where: {
        id: { in: facultyIds },
        role: { in: [UserRole.FACULTY, UserRole.ADMIN] },
      },
    });

    if (facultyUsers.length !== facultyIds.length) {
      return NextResponse.json(
        { message: "Some faculty IDs are invalid." },
        { status: 400 },
      );
    }

    /* ----------------------------
       11. Transaction Create
    ----------------------------- */
    const newGrant = await prisma.grantIn.create({
      data: {
        projectCode: projectCode ?? null,
        applicationDate: appDate,
        grantDate: grantDateParsed,
        durationOfProject: durationOfProject ?? null,

        amountGranted: amountGranted ?? null,
        usedAmount: usedAmount ?? null,

        isPublic: isPublic ?? false,

        facultyAuthors: {
          create: facultyAuthors.map((f) => ({
            userId: f.teacherId,
            role: f.role,
          })),
        },

        studentAuthors: {
          create: studentAuthors?.map((s) => ({
            userId: s.studentId,
          })),
        },
      },

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
      },
    });

    // Invalidate the sidebar grants cache for all authors involved so the
    // sidebar updates immediately on next navigation without waiting for the
    // 5-minute revalidation window.
    const involvedUserIds = new Set<string>([userId!])
    newGrant.facultyAuthors.forEach((fa) => involvedUserIds.add(fa.userId))
    newGrant.studentAuthors.forEach((sa) => involvedUserIds.add(sa.userId))
    involvedUserIds.forEach((id) => revalidateTag(`grants-sidebar-${id}`, {}))
    // Revalidate the admin shared cache for all-grants view
    revalidateTag(`grants-sidebar-all`, {})

    return NextResponse.json(
      {
        message: "GrantIn Created Successfully ✅",
        grant: newGrant,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("GrantIn POST Error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

interface GrantInGETQueryParams {
    projectCode?: string;
    facultyId?: string;
    studentId?: string;
    isPublic?: string; // "true" or "false"
    grantInStatus?:GrantInStatus;
    applicationDateFrom?: string;
    applicationDateTo?: string;
    grantDateFrom?: string;
    grantDateTo?: string;
    projectDurationFrom?: string;
    projectDurationTo?: string;
    projectDuration?: string;
    grantedAmountMin?: string;
    grantedAmountMax?: string;
    usedAmountMin?: string;
    usedAmountMax?: string;
    
}


export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized. Please login." },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    const { searchParams } = new URL(req.url);

    const queryParams: GrantInGETQueryParams = {
      projectCode: searchParams.get("projectCode") ?? undefined,
      facultyId: searchParams.get("facultyId") ?? undefined,
      studentId: searchParams.get("studentId") ?? undefined,
      isPublic: searchParams.get("isPublic") ?? undefined,
      grantInStatus: searchParams.get("grantInStatus") as GrantInStatus || undefined,
      applicationDateFrom: searchParams.get("applicationDateFrom") ?? undefined,
      applicationDateTo: searchParams.get("applicationDateTo") ?? undefined,
      grantDateFrom: searchParams.get("grantDateFrom") ?? undefined,
      grantDateTo: searchParams.get("grantDateTo") ?? undefined,
      projectDurationFrom: searchParams.get("projectDurationFrom") ?? undefined,
      projectDurationTo: searchParams.get("projectDurationTo") ?? undefined,
      projectDuration: searchParams.get("projectDuration") ?? undefined,
      grantedAmountMin: searchParams.get("grantedAmountMin") ?? undefined,
      grantedAmountMax: searchParams.get("grantedAmountMax") ?? undefined,
      usedAmountMin: searchParams.get("usedAmountMin") ?? undefined,
      usedAmountMax: searchParams.get("usedAmountMax") ?? undefined,
    };
    const whereClause: any = {};
    if (userRole === UserRole.FACULTY) {
      whereClause.facultyAuthors = {
        some: {
          userId: userId, // session faculty must be author
        },
      };
    }

    if (userRole === UserRole.STUDENT) {
      whereClause.studentAuthors = {
        some: {
          userId: userId, // session student must be author
        },
      };
    }

    if (queryParams.projectCode) {
      whereClause.projectCode = {
        contains: queryParams.projectCode,
        mode: "insensitive",
      };
    }
    if (queryParams.facultyId) {
      whereClause.facultyAuthors = {
        some: {
          userId: queryParams.facultyId,
        },
      };
    }
    if (queryParams.studentId) {
      whereClause.studentAuthors = {
        some: {
          userId: queryParams.studentId,
        },
      };
    }
    if (queryParams.isPublic) {
      whereClause.isPublic = queryParams.isPublic === "true";
    }
    if (queryParams.grantInStatus) {
      whereClause.grantInStatus = queryParams.grantInStatus;
    }
    if (queryParams.applicationDateFrom || queryParams.applicationDateTo) {
      whereClause.applicationDate = {
        ...(queryParams.applicationDateFrom && { gte: new Date(queryParams.applicationDateFrom) }),
        ...(queryParams.applicationDateTo   && { lte: new Date(queryParams.applicationDateTo)   }),
      }
    }
    if (queryParams.grantDateFrom || queryParams.grantDateTo) {
      whereClause.grantDate = {
        ...(queryParams.grantDateFrom && { gte: new Date(queryParams.grantDateFrom) }),
        ...(queryParams.grantDateTo   && { lte: new Date(queryParams.grantDateTo)   }),
      }
    }
    if (queryParams.projectDuration) {
      whereClause.durationOfProject = queryParams.projectDuration
    } else if (queryParams.projectDurationFrom || queryParams.projectDurationTo) {
      whereClause.durationOfProject = {
        ...(queryParams.projectDurationFrom && { gte: queryParams.projectDurationFrom }),
        ...(queryParams.projectDurationTo   && { lte: queryParams.projectDurationTo   }),
      }
    }
    if (queryParams.grantedAmountMin || queryParams.grantedAmountMax) {
      whereClause.amountGranted = {
        ...(queryParams.grantedAmountMin && { gte: parseFloat(queryParams.grantedAmountMin) }),
        ...(queryParams.grantedAmountMax && { lte: parseFloat(queryParams.grantedAmountMax) }),
      }
    }
    if (queryParams.usedAmountMin || queryParams.usedAmountMax) {
      whereClause.usedAmount = {
        ...(queryParams.usedAmountMin && { gte: parseFloat(queryParams.usedAmountMin) }),
        ...(queryParams.usedAmountMax && { lte: parseFloat(queryParams.usedAmountMax) }),
      }
    }


    const grants = await prisma.grantIn.findMany({
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
            user: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return NextResponse.json({grants}, { status: 200 });




  } catch (error) {
    console.error("GrantIn GET Error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}



export async function DELETE(req: NextRequest) {
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
    const { searchParams } = new URL(req.url);
    const grantIds = searchParams.get("grantIds");
    if (!grantIds) {
      return NextResponse.json(
        { message: "grantIds query parameter is required." },
        { status: 400 },
      );
    }
    const grantIdArray = grantIds.split(",").map((id) => id.trim());
    //check if all grantIds present or not and the session user if not admin should be author of all grants
    const grantsToDelete = await prisma.grantIn.findMany({
      where: {
        id: { in: grantIdArray },
        ...(session.user.role === UserRole.ADMIN ? {} : {
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
    if (grantsToDelete.length !== grantIdArray.length) {
      return NextResponse.json(
        { message: "Some grants not found or you don't have permission to delete them." },
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
    const deleteResult = await prisma.grantIn.deleteMany({
      where: {
        id: { in: grantIdArray },
      },
    });

    // Invalidate sidebar grants cache for all authors of the deleted grants
    const affectedUserIds = new Set<string>([session.user.id!])
    grantsToDelete.forEach((grant) =>
      grant.facultyAuthors.forEach((fa) => affectedUserIds.add(fa.userId))
    )
    affectedUserIds.forEach((id) => revalidateTag(`grants-sidebar-${id}`, {}))
    revalidateTag(`grants-sidebar-all`, {})

    return NextResponse.json(
      {
        message: `Deleted ${deleteResult.count} grants successfully ✅`,
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