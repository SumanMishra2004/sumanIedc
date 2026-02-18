import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { GrantInRole, UserRole } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: grantId } = await params;

    /* ---------------------------
       1. Auth Check
    ---------------------------- */
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    /* ---------------------------
       2. Grant Existence Check
    ---------------------------- */
    const grant = await prisma.grantIn.findUnique({
      where: { id: grantId },
      include: {
        facultyAuthors: true,
      },
    });

    if (!grant) {
      return NextResponse.json(
        { message: "Grant not found." },
        { status: 404 }
      );
    }

    /* ---------------------------
       3. Role + Author Permission
    ---------------------------- */

    // ✅ Admin can always add output
    if (userRole !== UserRole.ADMIN) {

      // Faculty must belong to this grant
      const isFacultyAuthor = grant.facultyAuthors.some(
        (author) => author.userId === userId
      );

      if (!isFacultyAuthor) {
        return NextResponse.json(
          {
            message:
              "Access denied. Only faculty authors of this grant can add outputs.",
          },
          { status: 403 }
        );
      }
    }

    /* ---------------------------
       4. Parse Body
    ---------------------------- */
    const body = await req.json();

    const { publicationType } = body;

    if (!publicationType) {
      return NextResponse.json(
        { message: "publicationType is required." },
        { status: 400 }
      );
    }

    /* ---------------------------
       5. Create Output Mapping
    ---------------------------- */
    const mapping = await prisma.grantInMapping.create({
      data: {
        grantInId: grantId,
        publicationType,

        patentId: body.patentId ?? null,
        journalId: body.journalId ?? null,
        conferenceId: body.conferenceId ?? null,
        bookChapterId: body.bookChapterId ?? null,
        copyrightId: body.copyrightId ?? null,
      },
    });

    return NextResponse.json(
      {
        message: "Grant output added successfully ✅",
        output: mapping,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Output POST Error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: grantInId } = await params;

    /* ---------------------------
       1. Auth Check
    ---------------------------- */
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    /* ---------------------------
       2. Block Students
    ---------------------------- */
    if (userRole === UserRole.STUDENT) {
      return NextResponse.json(
        { message: "Forbidden. Students cannot update outputs." },
        { status: 403 }
      );
    }

    /* ---------------------------
       3. Grant Existence Check
    ---------------------------- */
    const grant = await prisma.grantIn.findUnique({
      where: { id: grantInId },
      include: {
        facultyAuthors: true,
      },
    });

    if (!grant) {
      return NextResponse.json(
        { message: "Grant not found." },
        { status: 404 }
      );
    }

    /* ---------------------------
       4. Permission Check
       Only ADMIN or PI Faculty
    ---------------------------- */
    if (userRole !== UserRole.ADMIN) {
      const isPI = grant.facultyAuthors.some(
        (author) =>
          author.userId === userId &&
          author.role === GrantInRole.FACULTY_PI
      );

      if (!isPI) {
        return NextResponse.json(
          {
            message: "Access denied. Only PI faculty can update outputs.",
          },
          { status: 403 }
        );
      }
    }

    /* ---------------------------
       5. Parse Body
    ---------------------------- */
    const body = await req.json();
    const { mappingId, publicationType } = body;

    if (!mappingId) {
      return NextResponse.json(
        { message: "mappingId is required." },
        { status: 400 }
      );
    }

    if (!publicationType) {
      return NextResponse.json(
        { message: "publicationType is required." },
        { status: 400 }
      );
    }

    /* ---------------------------
       6. Mapping Must Belong to This Grant
    ---------------------------- */
    const existingMapping = await prisma.grantInMapping.findFirst({
      where: {
        id: mappingId,
        grantInId: grantInId, // ✅ ensures correct ownership
      },
    });

    if (!existingMapping) {
      return NextResponse.json(
        { message: "Output mapping not found for this grant." },
        { status: 404 }
      );
    }

    /* ---------------------------
       7. Update Mapping
    ---------------------------- */
    const updatedOutput = await prisma.grantInMapping.update({
      where: { id: mappingId },
      data: {
        publicationType,
        patentId: body.patentId ?? null,
        journalId: body.journalId ?? null,
        conferenceId: body.conferenceId ?? null,
        bookChapterId: body.bookChapterId ?? null,
        copyrightId: body.copyrightId ?? null,
      },
    });

    return NextResponse.json(
      {
        message: "Grant output updated successfully ✅",
        output: updatedOutput,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Output PATCH Error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}


export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: grantInId } = await params;

    /* ---------------------------
       1. Auth Check
    ---------------------------- */
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    /* ---------------------------
       2. Only ADMIN or PI
    ---------------------------- */
    const grant = await prisma.grantIn.findUnique({
      where: { id: grantInId },
      include: { facultyAuthors: true },
    });

    if (!grant) {
      return NextResponse.json(
        { message: "Grant not found." },
        { status: 404 }
      );
    }

    if (userRole !== UserRole.ADMIN) {
      const isPI = grant.facultyAuthors.some(
        (author) =>
          author.userId === userId &&
          author.role === GrantInRole.FACULTY_PI
      );

      if (!isPI) {
        return NextResponse.json(
          { message: "Access denied. Only PI can delete outputs." },
          { status: 403 }
        );
      }
    }

    /* ---------------------------
       3. Parse Body
    ---------------------------- */
    const body = await req.json();
    const { mappingId } = body;

    if (!mappingId) {
      return NextResponse.json(
        { message: "mappingId is required." },
        { status: 400 }
      );
    }

    /* ---------------------------
       4. Ensure Mapping Belongs to Grant
    ---------------------------- */
    const mapping = await prisma.grantInMapping.findFirst({
      where: {
        id: mappingId,
        grantInId: grantInId,
      },
    });

    if (!mapping) {
      return NextResponse.json(
        { message: "Output mapping not found for this grant." },
        { status: 404 }
      );
    }

    /* ---------------------------
       5. Delete Mapping
    ---------------------------- */
    const deletedOutput = await prisma.grantInMapping.delete({
      where: { id: mappingId },
    });

    return NextResponse.json(
      {
        message: "Output deleted successfully ✅",
        output: deletedOutput,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Output DELETE Error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
