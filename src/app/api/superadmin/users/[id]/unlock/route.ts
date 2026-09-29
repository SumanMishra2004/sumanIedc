import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";

// POST /api/superadmin/users/[id]/unlock — clear account lock & failed attempts
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireSuperAdmin(req);
  if (!guard.ok) return guard.response;
  try {
    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const user = await prisma.user.update({
      where: { id: params.id },
      data:  { lockedUntil: null, failedLoginAttempts: 0, isActive: true },
      select: { id: true, name: true, email: true, lockedUntil: true, failedLoginAttempts: true, isActive: true },
    });
    return NextResponse.json({ success: true, data: user, message: "Account unlocked" });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
