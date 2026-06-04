import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET - List currently logged in user's own achievements
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const achievements = await prisma.achievement.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ achievements })
  } catch (error) {
    console.error("Error fetching user achievements:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Submit a new achievement
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, category, year, imageUrl, documentUrl } = body

    if (!title || !description || !year) {
      return NextResponse.json(
        { error: "Title, description, and year are required fields" },
        { status: 400 }
      )
    }

    const achievement = await prisma.achievement.create({
      data: {
        title,
        description,
        category: category || null,
        year,
        imageUrl: imageUrl || null,
        documentUrl: documentUrl || null,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ achievement }, { status: 201 })
  } catch (error) {
    console.error("Error creating achievement:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
