
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

// GET - Get single FDP
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fdp = await prisma.fDP.findUnique({
      where: { id },
      include: {
        user: {
            select: {
                id: true,
                name: true,
                email: true,
                image: true
            }
        }
      }
    });

    if (!fdp) {
      return NextResponse.json(
        { error: "FDP not found" },
        { status: 404 }
      );
    }

    // Access control
    const isOwner = session.user.id === fdp.userId;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
        return NextResponse.json(
            { error: "Permission denied" },
            { status: 403 }
        );
    }

    return NextResponse.json(fdp);
  } catch (error) {
    console.error("Error fetching FDP:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update FDP
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check ownership
    const existingFDP = await prisma.fDP.findUnique({
        where: { id },
        select: { userId: true }
    });

    if (!existingFDP) {
        return NextResponse.json(
            { error: "FDP not found" },
            { status: 404 }
        );
    }

    const isOwner = session.user.id === existingFDP.userId;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
        return NextResponse.json(
            { error: "Permission denied" },
            { status: 403 }
        );
    }
    
    const body = await req.json();
    
    // Handle date conversion
    const dataToUpdate = { ...body };
    if (dataToUpdate.startDate) dataToUpdate.startDate = new Date(dataToUpdate.startDate);
    if (dataToUpdate.endDate) dataToUpdate.endDate = new Date(dataToUpdate.endDate);

    // Filter dangerous fields
    delete dataToUpdate.id;
    delete dataToUpdate.userId;
    delete dataToUpdate.createdAt;
    delete dataToUpdate.updatedAt;

    const updatedFDP = await prisma.fDP.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedFDP);
  } catch (error) {
    console.error("Error updating FDP:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete FDP
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;
    
        if (!session?.user) {
          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
          );
        }
    
        // Check ownership
        const existingFDP = await prisma.fDP.findUnique({
            where: { id },
            select: { userId: true }
        });
    
        if (!existingFDP) {
            return NextResponse.json(
                { error: "FDP not found" },
                { status: 404 }
            );
        }
    
        const isOwner = session.user.id === existingFDP.userId;
        const isAdmin = session.user.role === "ADMIN";
    
        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { error: "Permission denied" },
                { status: 403 }
            );
        }
    
        await prisma.fDP.delete({
          where: { id },
        });
    
        return NextResponse.json({ message: "FDP deleted successfully" });
      } catch (error) {
        console.error("Error deleting FDP:", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
}
