import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { AchievementStatus } from "@prisma/client"
import { isAdminOrHigher } from "@/lib/auth/permissions"

// Admin verification helper
async function requireAdmin() {
  const session = await auth()
  if (!session?.user || !isAdminOrHigher(session.user.role)) {
    return null
  }
  return session
}

// PATCH - Review and verify an achievement submission
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized — ADMIN access required" },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const { achievementStatus, isPublic, updateComment } = body

    const achievement = await prisma.achievement.findUnique({
      where: { id },
    })

    if (!achievement) {
      return NextResponse.json({ error: "Achievement not found" }, { status: 404 })
    }

    const updateData: any = {}

    if (achievementStatus !== undefined) {
      if (!Object.values(AchievementStatus).includes(achievementStatus as AchievementStatus)) {
        return NextResponse.json(
          { error: "Invalid achievement status value" },
          { status: 400 }
        )
      }
      updateData.achievementStatus = achievementStatus as AchievementStatus
    }

    if (isPublic !== undefined) {
      updateData.isPublic = Boolean(isPublic)
    }

    if (updateComment !== undefined) {
      updateData.updateComment = updateComment
    }

    const updated = await prisma.achievement.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            department: true,
          },
        },
      },
    })

    // Optional: Send system notification to the user about status change
    try {
      await prisma.notification.create({
        data: {
          userId: achievement.userId,
          title: `Achievement Status Updated`,
          message: `Your achievement "${achievement.title}" status has been set to ${achievementStatus || achievement.achievementStatus}.${updateComment ? ` Reason: ${updateComment}` : ""}`,
          type: "ACHIEVEMENT_UPDATE",
          link: "/dashboard/achievements",
        },
      })
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr)
    }

    return NextResponse.json({ achievement: updated })
  } catch (error) {
    console.error("Error updating admin achievement details:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Remove an achievement submission (Admin bypass)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized — ADMIN access required" },
        { status: 403 }
      )
    }

    const { id } = await params
    const achievement = await prisma.achievement.findUnique({
      where: { id },
    })

    if (!achievement) {
      return NextResponse.json({ error: "Achievement not found" }, { status: 404 })
    }

    await prisma.achievement.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Achievement deleted successfully by admin" })
  } catch (error) {
    console.error("Error deleting admin achievement:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
