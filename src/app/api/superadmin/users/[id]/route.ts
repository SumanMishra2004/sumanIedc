import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { UserRole } from "@prisma/client";

const patchSchema = z.object({
  role:      z.nativeEnum(UserRole).optional(),
  isActive:  z.boolean().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
}).strict();

// GET /api/superadmin/users/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireSuperAdmin(req);
  if (!guard.ok) return guard.response;
    const { id } = await params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, role: true, image: true,
        department: true, institution: true, isActive: true,
        profileCompleted: true, emailVerified: true, bio: true,
        lastLoginAt: true, createdAt: true, updatedAt: true,
        deletedAt: true, failedLoginAttempts: true, lockedUntil: true,
        enrollmentNo: true, designation: true, phone: true,
      },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: user });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

// PATCH /api/superadmin/users/[id] — role change, activate/deactivate, restore soft-delete
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireSuperAdmin(req);
  if (!guard.ok) return guard.response;
    const { id } = await params;

  try {
    if (guard.session.user.id === id)
      return NextResponse.json({ error: "Cannot modify your own account via this endpoint" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const parsed = patchSchema.parse(body);

    const data: any = {};
    if (parsed.role      !== undefined) data.role      = parsed.role;
    if (parsed.isActive  !== undefined) data.isActive  = parsed.isActive;
    if (parsed.deletedAt !== undefined) data.deletedAt = parsed.deletedAt ? new Date(parsed.deletedAt) : null;

    if (Object.keys(data).length === 0)
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });

    // Keep SpecialUser table in sync when role changes
    if (parsed.role) {
      await prisma.specialUser.upsert({
        where:  { email: existing.email },
        create: { email: existing.email, role: parsed.role },
        update: { role: parsed.role },
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, isActive: true, deletedAt: true },
    });
    return NextResponse.json({ success: true, data: user });
  } catch (e: any) {
    if (e?.name === "ZodError") return NextResponse.json({ error: "Invalid input", details: e.errors }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/superadmin/users/[id] — hard delete (permanent)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireSuperAdmin(req);
  if (!guard.ok) return guard.response;
    const { id } = await params;

  try {
    if (guard.session.user.id === id)
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });

    if (!await prisma.user.findUnique({ where: { id } }))
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "User permanently deleted" });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
