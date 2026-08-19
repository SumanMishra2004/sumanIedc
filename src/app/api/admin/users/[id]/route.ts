import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  isAdminOrHigher,
  canManageUser,
  canAssignRole,
  type UserRoleString,
} from "@/lib/auth/permissions";

// Helper: require ADMIN or higher
async function requireAdminOrHigher() {
  const session = await auth();
  if (!session?.user || !isAdminOrHigher(session.user.role)) {
    return null;
  }
  return session;
}

// GET /api/admin/users/[id] — fetch single user details
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminOrHigher();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized — ADMIN access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        department: true,
        phone: true,
        bio: true,
        profileCompleted: true,
        emailVerified: true,
        accounts: {
          select: {
            provider: true,
            type: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[id] — update profile fields OR assign role
// Role assignment lives in a separate body field `newRole` to make it
// intentionally explicit. All other editable profile fields are also allowed.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminOrHigher();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized — ADMIN access required" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    // ── Role assignment path ──────────────────────────────────────────────
    if (body.newRole !== undefined) {
      const targetRole = (body.newRole as string).toUpperCase() as UserRoleString;

      // Users cannot change their own role
      if (session.user.id === id) {
        return NextResponse.json(
          { error: "You cannot change your own role" },
          { status: 403 }
        );
      }

      // Fetch target user to check their current role
      const targetUser = await prisma.user.findUnique({
        where: { id },
        select: { id: true, role: true, email: true },
      });

      if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Check actor can manage the target user's current role
      if (!canManageUser(session.user.role, targetUser.role)) {
        return NextResponse.json(
          { error: "Insufficient permissions to manage this user" },
          { status: 403 }
        );
      }

      // Check actor can assign the target role
      if (!canAssignRole(session.user.role, targetRole)) {
        return NextResponse.json(
          { error: "Insufficient permissions to assign this role" },
          { status: 403 }
        );
      }

      const VALID_ROLES: UserRoleString[] = ['STUDENT', 'FACULTY', 'EDITOR', 'ADMIN', 'SUPERADMIN'];
      if (!VALID_ROLES.includes(targetRole)) {
        return NextResponse.json(
          { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
          { status: 400 }
        );
      }

      // Update the user's role in the User table immediately
      const updated = await prisma.user.update({
        where: { id },
        data: { role: targetRole },
        select: { id: true, name: true, email: true, role: true },
      });

      // Keep SpecialUser table in sync (upsert so it covers both new and existing entries)
      if (targetUser.email) {
        await prisma.specialUser.upsert({
          where: { email: targetUser.email },
          create: { email: targetUser.email, role: targetRole },
          update: { role: targetRole },
        });
      }

      return NextResponse.json({ success: true, data: updated });
    }

    // ── Profile fields update path ────────────────────────────────────────
    // Fetch target to check canManageUser
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!canManageUser(session.user.role, targetUser.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions to manage this user" },
        { status: 403 }
      );
    }

    // Whitelist only editable profile fields — email, password, role NOT included here
    const { name, department, phone, bio, image, profileCompleted } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (department !== undefined) updateData.department = department;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (image !== undefined) updateData.image = image;
    if (profileCompleted !== undefined) updateData.profileCompleted = Boolean(profileCompleted);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        department: true,
        phone: true,
        bio: true,
        profileCompleted: true,
        emailVerified: true,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error: unknown) {
    console.error("Error updating user:", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] — delete user
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminOrHigher();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized — ADMIN access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Prevent self-deletion
    if (session.user.id === id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Check target user's role — ADMIN cannot delete SUPERADMIN
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!canManageUser(session.user.role, targetUser.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions to delete this user" },
        { status: 403 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Error deleting user:", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
