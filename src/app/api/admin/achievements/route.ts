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

// GET - List all achievements for review
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized — ADMIN access required" },
        { status: 403 }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const where: any = {}

    if (status) {
      if (Object.values(AchievementStatus).includes(status as AchievementStatus)) {
        where.achievementStatus = status as AchievementStatus
      } else {
        return NextResponse.json(
          { error: "Invalid status parameter" },
          { status: 400 }
        )
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        {
          user: {
            name: { contains: search, mode: "insensitive" },
          },
        },
      ]
    }

    const achievements = await prisma.achievement.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            department: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ achievements })
  } catch (error) {
    console.error("Error fetching admin achievements list:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
