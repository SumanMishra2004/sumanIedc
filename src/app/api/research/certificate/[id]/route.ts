import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole, CertificateStatus } from "@prisma/client";
import { certificateSchema } from "@/lib/validations/certificate";

// GET - Get single certificate by ID
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
    const isAdmin = session?.user?.role === UserRole.ADMIN;
    const isPublic = certificate.isPublic;

    if (!isPublic && !isOwner && !isAdmin) {
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

    // Check if certificate exists
    const existingCert = await prisma.certificate.findUnique({
      where: { id }
    });

    if (!existingCert) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    const isOwner = session.user.id === existingCert.userId;
    const isAdmin = session.user.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // If student, they cannot modify status fields directly
    if (!isAdmin) {
      delete body.certificateStatus;
      delete body.updateComment;
    }

    const currentStatus = existingCert.certificateStatus;
    const newStatus = body.certificateStatus as CertificateStatus | undefined;

    // Validate final merged record against Zod Schema
    const mergedData = {
      title: body.title !== undefined ? body.title : existingCert.title,
      description: body.description !== undefined ? body.description : existingCert.description,
      keywords: body.keywords !== undefined ? body.keywords : existingCert.keywords,
      documentUrl: body.documentUrl !== undefined ? body.documentUrl : existingCert.documentUrl,
      offeredBy: body.offeredBy !== undefined ? body.offeredBy : existingCert.offeredBy,
      dateOfCompletion: body.dateOfCompletion !== undefined ? body.dateOfCompletion : existingCert.dateOfCompletion,
      remark: body.remark !== undefined ? body.remark : existingCert.remark,
      isPublic: body.isPublic !== undefined ? body.isPublic : existingCert.isPublic,
      certificateStatus: body.certificateStatus !== undefined ? body.certificateStatus : existingCert.certificateStatus,
      updateComment: body.updateComment !== undefined ? body.updateComment : existingCert.updateComment,
    };

    const validationResult = certificateSchema.safeParse(mergedData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message, details: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Update certificate in DB
    const dataToUpdate: any = {};
    const directFields = [
      "title",
      "description",
      "keywords",
      "documentUrl",
      "offeredBy",
      "remark",
      "isPublic",
      "certificateStatus",
      "updateComment",
    ];

    for (const field of directFields) {
      if (body[field] !== undefined) {
        dataToUpdate[field] = body[field];
      }
    }

    if (body.dateOfCompletion !== undefined) {
      dataToUpdate.dateOfCompletion = body.dateOfCompletion ? new Date(body.dateOfCompletion) : null;
    }

    // Automated transitions
    if (!isAdmin && currentStatus === CertificateStatus.APPROVED) {
      // Re-submit if user edits their own approved certificate
      dataToUpdate.certificateStatus = CertificateStatus.SUBMITTED;
      dataToUpdate.updateComment = null;
    }

    const updatedCertificate = await prisma.certificate.update({
      where: { id },
      data: dataToUpdate,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Send notifications on status transitions
    if (newStatus && newStatus !== currentStatus) {
      const notifyUser = async (uId: string, title: string, message: string, type: string) => {
        try {
          await prisma.notification.create({
            data: {
              userId: uId,
              title,
              message,
              type,
              link: `/dashboard/certificate?id=${id}`,
            }
          });
        } catch (err) {
          console.error("Failed to notify user on certificate status update:", err);
        }
      };

      if (newStatus === CertificateStatus.APPROVED) {
        await notifyUser(
          updatedCertificate.userId,
          "Certificate Approved",
          `Your certificate '${updatedCertificate.title}' has been verified and approved by the administrator.`,
          "CERTIFICATE_APPROVED"
        );
      }
    }

    // If updateComment was added or modified by admin, notify the owner
    if (isAdmin && body.updateComment && body.updateComment !== existingCert.updateComment) {
      try {
        await prisma.notification.create({
          data: {
            userId: updatedCertificate.userId,
            title: "Revision Requested for Certificate",
            message: `The administrator requested corrections for your certificate '${updatedCertificate.title}'. Reason: ${body.updateComment}`,
            type: "CERTIFICATE_UPDATE_REQUESTED",
            link: `/dashboard/certificate?id=${id}`,
          }
        });
      } catch (err) {
        console.error("Failed to notify user of certificate comment update:", err);
      }
    }

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
    const isAdmin = session.user.role === UserRole.ADMIN;

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
