import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { storage } from "@/lib/appwrite";
import { BillStatus, UserRole, GrantInRole } from "@prisma/client";
import { regenerateMasterPdf } from "@/lib/research/masterPdf.service";

const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; billId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

        const { id, billId } = await params;
        const grantId = id;
        const userRole = session.user.role as UserRole;
        const body = await req.json();
        const action = body.action; // 'ACCEPT' or 'REJECT' (though reject is usually delete)

        if (action !== 'ACCEPT' && action !== 'REJECT') {
             return new NextResponse("Invalid action", { status: 400 });
        }

        // 1. Fetch Bill
        const bill = await prisma.grantInBill.findUnique({
            where: { id: billId }
        });

        if (!bill || bill.grantInId !== grantId) {
            return new NextResponse("Bill not found", { status: 404 });
        }

        // 2. Authorization: Only Admin or PI/CoPI
        const facultyAuth = await prisma.grantInTeacherAuthor.findFirst({
            where: {
                grantInId: grantId,
                userId: session.user.id,
                role: { in: [GrantInRole.FACULTY_PI, GrantInRole.FACULTY_COPI] }
            }
        });
        const isVerifier = userRole === "ADMIN" || !!facultyAuth;

        if (!isVerifier) {
             return new NextResponse("Forbidden: Only Admin or PI/CoPI can verify bills", { status: 403 });
        }

        // 3. Logic
        if (action === 'ACCEPT') {
             const updatedBill = await prisma.grantInBill.update({
                 where: { id: billId },
                 data: { billStatus: BillStatus.ACCEPTED }
             });
             
             // Regenerate Master PDF
             await regenerateMasterPdf(grantId);

             return NextResponse.json(updatedBill);
        } else {
             // Reject logic -> Delete
              if (bill.fileId) {
                try {
                    await storage.deleteFile(BUCKET_ID, bill.fileId);
                } catch (e) {
                    console.error("Failed to delete file from Appwrite", e);
                }
            }

            await prisma.grantInBill.delete({
                where: { id: billId }
            });
            return NextResponse.json({ message: "Bill rejected and removed" });
        }

    } catch (error: any) {
        console.error("Verification error:", error);
        return new NextResponse(error.message || "Internal Error", { status: 500 });
    }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; billId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { id, billId } = await params;
    const grantId = id;
    const userRole = session.user.role as UserRole;

    // 1. Fetch Bill
    const bill = await prisma.grantInBill.findUnique({
      where: { id: billId }
    });

    if (!bill || bill.grantInId !== grantId) {
      return new NextResponse("Bill not found", { status: 404 });
    }

    // 2. Authorization Logic
    // If PENDING: Uploader OR Admin OR PI/CoPI can delete
    // If ACCEPTED: Only Admin OR PI/CoPI can delete

    const isUploader = bill.userId === session.user.id;
    
    // Check faculty role
    const facultyAuth = await prisma.grantInTeacherAuthor.findFirst({
        where: {
            grantInId: grantId,
            userId: session.user.id,
            role: { in: [GrantInRole.FACULTY_PI, GrantInRole.FACULTY_COPI] }
        }
    });
    
    const isVerifier = userRole === "ADMIN" || !!facultyAuth;

    if (bill.billStatus === BillStatus.PENDING) {
        if (!isUploader && !isVerifier) {
            return new NextResponse("Forbidden: Only uploader or authorized personnel can delete pending bills", { status: 403 });
        }
    } else if (bill.billStatus === BillStatus.ACCEPTED) {
        if (!isVerifier) {
            return new NextResponse("Forbidden: Only Admin or PI/CoPI can delete accepted bills", { status: 403 });
        }
    }

    // 3. Delete Logic
    // Delete file from Appwrite
    if (bill.fileId) {
        try {
            await storage.deleteFile(BUCKET_ID, bill.fileId);
        } catch (e) {
            console.error("Failed to delete file from Appwrite", e);
        }
    }

    // Delete DB record
    await prisma.grantInBill.delete({
        where: { id: billId }
    });

    // 4. Regenerate Master PDF if it was an ACCEPTED bill
    if (bill.billStatus === BillStatus.ACCEPTED) {
        await regenerateMasterPdf(grantId);
    }

    return NextResponse.json({ message: "Bill deleted successfully" });

  } catch (error: any) {
    console.error("Delete error:", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
