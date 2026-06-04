import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole, BillStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please login." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as BillStatus | null;

    const userRole = session.user.role;
    const userId = session.user.id;

    const whereClause: any = {
      isMasterPdf: false,
    };

    if (status) {
      whereClause.billStatus = status;
    }

    // Role-based restrictions
    if (userRole === UserRole.ADMIN) {
      whereClause.grantIn = {
        hideFromAdmin: false,
      };
    } else if (userRole === UserRole.FACULTY) {
      whereClause.grantIn = {
        facultyAuthors: {
          some: {
            userId: userId,
          },
        },
      };
    } else if (userRole === UserRole.STUDENT) {
      whereClause.grantIn = {
        studentAuthors: {
          some: {
            userId: userId,
          },
        },
      };
    }

    const bills = await prisma.grantInBill.findMany({
      where: whereClause,
      include: {
        grantIn: {
          select: {
            id: true,
            projectCode: true,
            amountGranted: true,
            usedAmount: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ bills }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching bills:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
