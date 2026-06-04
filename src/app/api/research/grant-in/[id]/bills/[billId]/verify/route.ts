import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { storage } from "@/lib/appwrite";
import { BillStatus, UserRole, GrantInRole } from "@prisma/client";
import { regenerateMasterPdf } from "@/lib/research/masterPdf.service";
import { notifyBillAccepted, notifyBillRejected } from "@/lib/research/grantNotifications";

const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; billId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { id, billId } = await params;
    const grantId = id; // map
    const body = await req.json();
    const { action } = body; // "ACCEPT" or "REJECT"

    if (!["ACCEPT", "REJECT"].includes(action)) {
      return new NextResponse("Invalid action", { status: 400 });
    }

    // 1. Authorization
    // Check if user is ADMIN or Faculty PI/CoPI
    const userRole = session.user.role as UserRole;
    
    // Check grant relationship
    const facultyAuth = await prisma.grantInTeacherAuthor.findFirst({
      where: {
        grantInId: grantId,
        userId: session.user.id,
        role: { in: [GrantInRole.FACULTY_PI, GrantInRole.FACULTY_COPI] }
      }
    });

    const grant = await prisma.grantIn.findUnique({
      where: { id: grantId }
    });

    if (!grant) {
      return new NextResponse("Grant not found", { status: 404 });
    }

    if (userRole === "ADMIN" && grant.hideFromAdmin) {
      return new NextResponse("Forbidden: Grant is hidden from Admin", { status: 403 });
    }

    const isAuthorized = userRole === "ADMIN" || !!facultyAuth;

    if (!isAuthorized) {
      return new NextResponse("Forbidden: Only PI, Co-PI or Admin can verify bills", { status: 403 });
    }

    // 2. Fetch Bill
    const bill = await prisma.grantInBill.findUnique({
      where: { id: billId }
    });

    if (!bill || bill.grantInId !== grantId) {
      return new NextResponse("Bill not found", { status: 404 });
    }

    if (bill.billStatus === BillStatus.ACCEPTED) {
      return new NextResponse("Bill already accepted", { status: 400 });
    }

    // 3. Process Action
    if (action === "ACCEPT") {
      // Update status
      const updatedBill = await prisma.grantInBill.update({
        where: { id: billId },
        data: {
            billStatus: BillStatus.ACCEPTED,
        }
      });
      await prisma.grantIn.update({
        where: { id: grantId },
        data: {
          usedAmount: { increment: bill.amount || 0 },
        },
      });

      // Trigger Master PDF Regeneration
      await regenerateMasterPdf(grantId);

      // Trigger notification
      await notifyBillAccepted(grantId, billId);

      return NextResponse.json(updatedBill);
    } 
    else if (action === "REJECT") {
      // Delete file & record
      if (bill.fileId) {
        try {
            await storage.deleteFile(BUCKET_ID, bill.fileId);
        } catch (e) {
            console.error("Failed to delete rejected file from Appwrite", e);
        }
      }

      // Trigger notification before deleting the bill
      await notifyBillRejected(grantId, billId);

      await prisma.grantInBill.delete({
        where: { id: billId }
      });

      return NextResponse.json({ message: "Bill rejected and deleted" });
    }

  } catch (error: any) {
    console.error("Verify error:", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
