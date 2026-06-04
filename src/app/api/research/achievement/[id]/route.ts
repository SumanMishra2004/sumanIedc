import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET - Get user's own achievement details
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const achievement = await prisma.achievement.findUnique({
      where: { id },
    })

    if (!achievement) {
      return NextResponse.json({ error: "Achievement not found" }, { status: 404 })
    }

    // Check ownership
    if (achievement.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden — You do not own this achievement" },
        { status: 403 }
      )
    }

    return NextResponse.json({ achievement })
  } catch (error) {
    console.error("Error fetching user achievement:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH - Update user's own achievement (only editable if status is not APPROVED)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { title, description, category, year, imageUrl, documentUrl } = body

    const achievement = await prisma.achievement.findUnique({
      where: { id },
    })

    if (!achievement) {
      return NextResponse.json({ error: "Achievement not found" }, { status: 404 })
    }

    // Check ownership
    if (achievement.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden — You do not own this achievement" },
        { status: 403 }
      )
    }

    // Check status
    if (achievement.achievementStatus === "APPROVED") {
      return NextResponse.json(
        { error: "Approved achievements cannot be modified" },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (year !== undefined) updateData.year = year
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (documentUrl !== undefined) updateData.documentUrl = documentUrl

    // Reset status to SUBMITTED upon modification for re-verification
    updateData.achievementStatus = "SUBMITTED"

    const updated = await prisma.achievement.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ achievement: updated })
  } catch (error) {
    console.error("Error updating user achievement:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Remove user's own achievement (only deletable if status is not APPROVED)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const achievement = await prisma.achievement.findUnique({
      where: { id },
    })

    if (!achievement) {
      return NextResponse.json({ error: "Achievement not found" }, { status: 404 })
    }

    // Check ownership
    if (achievement.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden — You do not own this achievement" },
        { status: 403 }
      )
    }

    // Check status
    if (achievement.achievementStatus === "APPROVED") {
      return NextResponse.json(
        { error: "Approved achievements cannot be deleted" },
        { status: 400 }
      )
    }

    await prisma.achievement.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Achievement deleted successfully" })
  } catch (error) {
    console.error("Error deleting user achievement:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
