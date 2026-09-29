import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { UserRole } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireSuperAdmin(req);
  if (!guard.ok) return guard.response;
  try {
    const existing = await prisma.specialUser.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Special user not found" }, { status: 404 });

    const body = await req.json();
    if (body.role && !Object.values(UserRole).includes(body.role))
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });

    const su = await prisma.specialUser.update({
      where: { id: params.id },
      data:  { ...(body.role && { role: body.role }) },
    });
    return NextResponse.json({ success: true, data: su });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireSuperAdmin(req);
  if (!guard.ok) return guard.response;
  try {
    if (!await prisma.specialUser.findUnique({ where: { id: params.id } }))
      return NextResponse.json({ error: "Special user not found" }, { status: 404 });
    await prisma.specialUser.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: "Special user deleted" });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
