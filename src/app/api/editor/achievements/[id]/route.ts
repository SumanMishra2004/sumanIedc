import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/auth/guard";
import { AchievementStatus } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;
  try {
    const achievement = await prisma.achievement.findUnique({
      where: { id: params.id },
      include: { user: { select: { id: true, name: true, email: true, department: true, role: true } } },
    });
    if (!achievement) return NextResponse.json({ error: "Achievement not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: achievement });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;
  try {
    const existing = await prisma.achievement.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Achievement not found" }, { status: 404 });

    const body = await req.json();
    if (body.achievementStatus && !Object.values(AchievementStatus).includes(body.achievementStatus)) {
      return NextResponse.json({ error: "Invalid achievementStatus" }, { status: 400 });
    }

    const updateData: any = {};
    const fields = ["achievementStatus", "isPublic", "title", "description", "category", "year",
      "imageUrl", "documentUrl", "updateComment"];
    for (const f of fields) { if (body[f] !== undefined) updateData[f] = body[f]; }

    const achievement = await prisma.achievement.update({ where: { id: params.id }, data: updateData });
    return NextResponse.json({ success: true, data: achievement });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
