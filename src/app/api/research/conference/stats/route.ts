import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { auth } from '@/lib/auth'

// GET - Get statistics for conferences
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get user with role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Build filter based on user role
    const roleFilter = user.role === UserRole.ADMIN 
      ? {} // Admin sees all
      : user.role === UserRole.FACULTY
      ? {
          OR: [
            { isPublic: true },
            { facultyAuthors: { some: { userId: user.id } } }
          ]
        }
      : { // STUDENT
          OR: [
            { isPublic: true },
            { studentAuthors: { some: { userId: user.id } } }
          ]
        }
   
    // Get counts by conference status
    const conferenceStatusCounts = await prisma.conference.groupBy({
      by: ['conferenceStatus'],
      where: roleFilter,
      _count: {
        conferenceStatus: true
      }
    })

    // Get public vs private counts
    const publicCount = await prisma.conference.count({
      where: {
        ...roleFilter,
        isPublic: true
      }
    })

    const privateCount = await prisma.conference.count({
      where: {
        ...roleFilter,
        isPublic: false
      }
    })
    
    // Get total count
    const total = await prisma.conference.count({
      where: roleFilter
    })

    return NextResponse.json({
      total,
      publicCount,
      privateCount,
      conferenceStatusCounts: conferenceStatusCounts.map(item => ({
        status: item.conferenceStatus,
        count: item._count.conferenceStatus
      }))
    })
  } catch (error) {
    console.error('Error fetching conference stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
