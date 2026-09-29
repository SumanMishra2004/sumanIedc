import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { UserRole } from "@prisma/client";

const createSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase()),
  role:  z.nativeEnum(UserRole).default("FACULTY"),
});

// GET /api/superadmin/special-users
export async function GET(req: NextRequest) {
  const guard = await requireSuperAdmin(req);
  if (!guard.ok) return guard.response;
  try {
    const data = await prisma.specialUser.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, data });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

// POST /api/superadmin/special-users — pre-register a user email with a role
export async function POST(req: NextRequest) {
  const guard = await requireSuperAdmin(req);
  if (!guard.ok) return guard.response;
  try {
    const body = await req.json();
    const { email, role } = createSchema.parse(body);

    const su = await prisma.specialUser.upsert({
      where:  { email },
      create: { email, role },
      update: { role },
    });
    return NextResponse.json({ success: true, data: su }, { status: 201 });
  } catch (e: any) {
    if (e?.name === "ZodError") return NextResponse.json({ error: "Invalid input", details: e.errors }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
