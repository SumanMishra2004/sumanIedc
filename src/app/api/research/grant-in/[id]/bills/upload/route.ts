import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ID, storage} from "@/lib/appwrite";
import { BillType, BillStatus } from "@prisma/client";

const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const grantId = id; // Map id to grantId for consistency
    
    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const billTypeStr = formData.get("billType") as string;
    const amountStr = formData.get("amount") as string;
    const billDateStr = formData.get("billDate") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate Bill Type
    let billType: BillType = BillType.OTHER;
    if (billTypeStr && Object.values(BillType).includes(billTypeStr as BillType)) {
      billType = billTypeStr as BillType;
    }

    // Amount
    const amount = amountStr ? parseFloat(amountStr) : 0;

    // Date
    const billDate = billDateStr ? new Date(billDateStr) : new Date();

    // 1. Upload to Appwrite
    // Check if grant exists
    const grantIn = await prisma.grantIn.findUnique({
      where: { id: grantId },
      include:{
        facultyAuthors: true,
        studentAuthors: true,
      }
    });
    
    if (!grantIn) {
      return NextResponse.json({ error: "Grant not found" }, { status: 404 });
    }
    if(session.user.role !== "ADMIN"){ 
    const isFacultyAuthor = grantIn.facultyAuthors.some(fa => fa.userId === session.user.id);
    const isStudentAuthor = grantIn.studentAuthors.some(sa => sa.userId === session.user.id);
    
    if (!isFacultyAuthor && !isStudentAuthor) {
      return NextResponse.json({ error: "Forbidden. You must be an author of this grant to upload bills." }, { status: 403 });
    }
  }
    // Upload
    // We use ID.unique() for fileId
    const fileId = ID.unique();
    
    // Note: The Appwrite SDK `createFile` expects the third argument to be a File.
    // Next.js FormData yields a File.
    const uploadedFile = await storage.createFile(BUCKET_ID, fileId, file);

    // Get View URL
    const fileUrl = storage.getFileView(BUCKET_ID, uploadedFile.$id).toString();

    // 2. Create DB Record
    const bill = await prisma.grantInBill.create({
      data: {
        fileId: uploadedFile.$id,
        fileUrl: fileUrl,
        billType: billType,
        billStatus: BillStatus.PENDING,
        billDate: billDate,
        amount: amount,
        isMasterPdf: false,
        userId: session.user.id,
        grantInId: grantId
      }
    });

    return NextResponse.json(bill, { status: 201 });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload bill" },
      { status: 500 }
    );
  }
}
