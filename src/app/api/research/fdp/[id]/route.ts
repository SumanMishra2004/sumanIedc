import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole, FDPStatus } from "@prisma/client";
import { fdpSchema } from "@/lib/validations/fdp";
import { sendNotificationEmail } from "@/lib/mail";
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

    // Access control: admins see all, otherwise user must be owner
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
        where: { id }
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

    // If faculty, they cannot modify status fields directly
    if (!isAdmin) {
      delete body.fdpStatus;
      delete body.updateComment;
    }

    const currentStatus = existingFDP.fdpStatus;
    const newStatus = body.fdpStatus as FDPStatus | undefined;

    // Validate final merged record against Zod Schema
    const mergedData = {
      title: body.title !== undefined ? body.title : existingFDP.title,
      description: body.description !== undefined ? body.description : existingFDP.description,
      keywords: body.keywords !== undefined ? body.keywords : existingFDP.keywords,
      organizedBy: body.organizedBy !== undefined ? body.organizedBy : existingFDP.organizedBy,
      startDate: body.startDate !== undefined ? body.startDate : existingFDP.startDate,
      endDate: body.endDate !== undefined ? body.endDate : existingFDP.endDate,
      topic: body.topic !== undefined ? body.topic : existingFDP.topic,
      duration: body.duration !== undefined ? body.duration : existingFDP.duration,
      remark: body.remark !== undefined ? body.remark : existingFDP.remark,
      isPublic: body.isPublic !== undefined ? body.isPublic : existingFDP.isPublic,
      fdpStatus: body.fdpStatus !== undefined ? body.fdpStatus : existingFDP.fdpStatus,
      updateComment: body.updateComment !== undefined ? body.updateComment : existingFDP.updateComment,
    };

    const validationResult = fdpSchema.safeParse(mergedData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message, details: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Update FDP in DB
    const dataToUpdate: any = {};
    const directFields = [
      "title",
      "description",
      "keywords",
      "organizedBy",
      "topic",
      "duration",
      "remark",
      "isPublic",
      "fdpStatus",
      "updateComment",
    ];

    for (const field of directFields) {
      if (body[field] !== undefined) {
        dataToUpdate[field] = body[field];
      }
    }

    if (body.startDate !== undefined) {
      dataToUpdate.startDate = body.startDate ? new Date(body.startDate) : null;
    }
    if (body.endDate !== undefined) {
      dataToUpdate.endDate = body.endDate ? new Date(body.endDate) : null;
    }

    // Automated transitions
    if (!isAdmin && currentStatus === FDPStatus.APPROVED) {
      // Re-submit if user edits their own approved FDP
      dataToUpdate.fdpStatus = FDPStatus.SUBMITTED;
      dataToUpdate.updateComment = null;
    }

    const updatedFDP = await prisma.fDP.update({
      where: { id },
      data: dataToUpdate,
      include: {
        user: { select: { name: true, email: true } }
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
              link: `/dashboard/fdp?id=${id}`,
            }
          });
        } catch (err) {
          console.error("Failed to notify user on FDP status update:", err);
        }
      };

      if (newStatus === FDPStatus.APPROVED) {
        await notifyUser(
          updatedFDP.userId,
          "FDP Approved",
          `Your FDP record '${updatedFDP.title}' has been verified and approved by the administrator.`,
          "FDP_APPROVED"
        );
        if (updatedFDP.user?.email) {
          await sendNotificationEmail({
            to: updatedFDP.user.email,
            recipientName: updatedFDP.user.name || "User",
            type: "APPROVED",
            resourceType: "fdp",
            resourceTitle: updatedFDP.title,
            dashboardLink: `/dashboard/fdp?id=${id}`,
          }).catch(err => console.error("[Email] Failed to send email", err))
        }
      }
    }

    // If updateComment was added or modified by admin, notify the owner
    if (isAdmin && body.updateComment && body.updateComment !== existingFDP.updateComment) {
      try {
        await prisma.notification.create({
          data: {
            userId: updatedFDP.userId,
            title: "Revision Requested for FDP",
            message: `The administrator requested corrections for your FDP record '${updatedFDP.title}'. Reason: ${body.updateComment}`,
            type: "FDP_UPDATE_REQUESTED",
            link: `/dashboard/fdp?id=${id}`,
          }
        });
        if (updatedFDP.user?.email) {
          await sendNotificationEmail({
            to: updatedFDP.user.email,
            recipientName: updatedFDP.user.name || "User",
            type: "REVISION",
            resourceType: "fdp",
            resourceTitle: updatedFDP.title,
            dashboardLink: `/dashboard/fdp?id=${id}`,
            message: body.updateComment,
          }).catch(err => console.error("[Email] Failed to send email", err))
        }
      } catch (err) {
        console.error("Failed to notify user of FDP comment update:", err);
      }
    }

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
