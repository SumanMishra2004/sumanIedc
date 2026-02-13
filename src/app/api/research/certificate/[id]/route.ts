
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

// GET - Get single certificate
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    const certificate = await prisma.certificate.findUnique({
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

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    // Access control
    const isOwner = session?.user?.id === certificate.userId;
    const isAdmin = session?.user?.role === "ADMIN";
    const isPublic = certificate.isPublic;

    if (!isPublic && !isOwner && !isAdmin) {
        // If not public, and requester is neither owner nor admin
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 403 }
        );
    }

    return NextResponse.json(certificate);
  } catch (error) {
    console.error("Error fetching certificate:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update certificate
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

    const body = await req.json();

    // Check ownership
    const existingCert = await prisma.certificate.findUnique({
        where: { id },
        select: { userId: true }
    });

    if (!existingCert) {
        return NextResponse.json(
            { error: "Certificate not found" },
            { status: 404 }
        );
    }

    const isOwner = session.user.id === existingCert.userId;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
        return NextResponse.json(
            { error: "Permission denied" },
            { status: 403 }
        );
    }
    
    // Handle date conversion if present
    const dataToUpdate = { ...body };
    if (dataToUpdate.dateOfCompletion) {
        dataToUpdate.dateOfCompletion = new Date(dataToUpdate.dateOfCompletion);
    }
    // Prevent updating sensitive fields or relations if needed (e.g. userId)
    delete dataToUpdate.id;
    delete dataToUpdate.userId;
    delete dataToUpdate.createdAt;
    delete dataToUpdate.updatedAt;

    const updatedCertificate = await prisma.certificate.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedCertificate);
  } catch (error) {
    console.error("Error updating certificate:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete certificate
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
        const existingCert = await prisma.certificate.findUnique({
            where: { id },
            select: { userId: true }
        });
    
        if (!existingCert) {
            return NextResponse.json(
                { error: "Certificate not found" },
                { status: 404 }
            );
        }
    
        const isOwner = session.user.id === existingCert.userId;
        const isAdmin = session.user.role === "ADMIN";
    
        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { error: "Permission denied" },
                { status: 403 }
            );
        }
    
        await prisma.certificate.delete({
          where: { id },
        });
    
        return NextResponse.json({ message: "Certificate deleted successfully" });
      } catch (error) {
        console.error("Error deleting certificate:", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
}
