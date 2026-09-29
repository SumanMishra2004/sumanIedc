import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  withRole,
  paginatedResponse,
  createdResponse,
  notFoundResponse,
  forbiddenResponse,
  handleApiError,
  getPaginationParams,
  isUserAuthor,
} from "@/lib/api";
import { BillType } from "@prisma/client";

const createBillSchema = z.object({
  fileId: z.string().min(1),
  fileUrl: z.string().url().optional(),
  billType: z.nativeEnum(BillType).default("OTHER"),
  customBillType: z.string().optional(),
  isMasterPdf: z.boolean().default(false),
  billDate: z.string().datetime().optional(),
  amount: z.number().min(0).optional(),
});

// GET /api/faculty/grants/[id]/bills
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const isAuthor = await isUserAuthor("grantIn", params.id, user.id);
      if (!isAuthor) return forbiddenResponse("Access denied");

      const { searchParams } = new URL(req.url);
      const { page, limit, skip } = getPaginationParams(searchParams);

      const [bills, total] = await Promise.all([
        prisma.grantInBill.findMany({
          where: { grantInId: params.id },
          select: {
            id: true,
            fileId: true,
            fileUrl: true,
            billType: true,
            customBillType: true,
            isMasterPdf: true,
            billStatus: true,
            billDate: true,
            amount: true,
            createdAt: true,
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { billDate: "desc" },
          skip,
          take: limit,
        }),
        prisma.grantInBill.count({ where: { grantInId: params.id } }),
      ]);

      return paginatedResponse(bills, page, limit, total);
    } catch (error) { return handleApiError(error); }
  })(req);
}

// POST /api/faculty/grants/[id]/bills
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const isAuthor = await isUserAuthor("grantIn", params.id, user.id);
      if (!isAuthor) return forbiddenResponse("Access denied");

      const grant = await prisma.grantIn.findUnique({
        where: { id: params.id },
        select: { grantInStatus: true },
      });
      if (!grant) return notFoundResponse("Grant");
      if (grant.grantInStatus === "REJECTED") return forbiddenResponse("Cannot add bills to a rejected grant");

      const body = await req.json();
      const validated = createBillSchema.parse(body);

      const bill = await prisma.grantInBill.create({
        data: {
          grantInId: params.id,
          userId: user.id,
          fileId: validated.fileId,
          fileUrl: validated.fileUrl,
          billType: validated.billType,
          customBillType: validated.customBillType,
          isMasterPdf: validated.isMasterPdf,
          billDate: validated.billDate ? new Date(validated.billDate) : new Date(),
          amount: validated.amount,
          billStatus: "PENDING",
        },
      });

      return createdResponse(bill, "Bill uploaded successfully");
    } catch (error) { return handleApiError(error); }
  })(req);
}
