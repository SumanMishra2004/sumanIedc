import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { BillStatus } from "@prisma/client";

// PATCH /api/admin/grants/[id]/bills/[billId] — update bill status (ACCEPTED/REJECTED/PAID)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; billId: string }> }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  try {
    const { id, billId } = await params;
    const existing = await prisma.grantInBill.findFirst({
      where: { id: billId, grantInId: id },
    });
    if (!existing) return NextResponse.json({ error: "Bill not found" }, { status: 404 });

    const body = await req.json();
    if (body.billStatus && !Object.values(BillStatus).includes(body.billStatus))
      return NextResponse.json({ error: "Invalid billStatus" }, { status: 400 });

    const data: any = {};
    if (body.billStatus !== undefined) data.billStatus = body.billStatus;
    if (body.amount     !== undefined) data.amount     = body.amount;

    const bill = await prisma.grantInBill.update({ where: { id: billId }, data });
    return NextResponse.json({ success: true, data: bill });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; billId: string }> }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  try {
    const { id, billId } = await params;
    const existing = await prisma.grantInBill.findFirst({
      where: { id: billId, grantInId: id },
    });
    if (!existing) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    await prisma.grantInBill.delete({ where: { id: billId } });
    return NextResponse.json({ success: true, message: "Bill deleted" });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
