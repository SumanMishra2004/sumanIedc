import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
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
      ? { hideFromAdmin: false } 
      : user.role === UserRole.FACULTY
      ? {
          OR: [
           
            { facultyAuthors: { some: { userId: user.id } } }
          ]
        }
      : { // STUDENT
          OR: [
           
            { studentAuthors: { some: { userId: user.id } } }
          ]
        }
   
    // Get counts by grant status
    const grantStatusCounts = await prisma.grantIn.groupBy({
      by: ['grantInStatus'],
      where: roleFilter,
      _count: {
        id: true
      }
    })

    // Get total counts
    const [total, publicCount, privateCount] = await Promise.all([
      prisma.grantIn.count({ where: roleFilter }),
      prisma.grantIn.count({ 
        where: user.role === UserRole.ADMIN 
          ? { isPublic: true, hideFromAdmin: false }
          : { 
              AND: [
                roleFilter,
                { isPublic: true }
              ]
            }
      }),
      prisma.grantIn.count({ 
        where: user.role === UserRole.ADMIN 
          ? { isPublic: false, hideFromAdmin: false }
          : { 
              AND: [
                roleFilter,
                { isPublic: false }
              ]
            }
      })
    ])

    // Get total financial stats
    const financials = await prisma.grantIn.aggregate({
      where: roleFilter,
      _sum: {
        amountGranted: true,
        usedAmount: true
      },
      _avg: {
        amountGranted: true,
        usedAmount: true
      }
    })

    return NextResponse.json({
      data: {
        total,
        publicCount,
        privateCount,
        grantStatusCounts: grantStatusCounts.map(s => ({
          status: s.grantInStatus,
          count: s._count.id
        })),
        financials: {
          totalAmountGranted: financials._sum.amountGranted || 0,
          totalUsedAmount: financials._sum.usedAmount || 0,
          avgAmountGranted: financials._avg.amountGranted || 0,
          avgUsedAmount: financials._avg.usedAmount || 0
        }
      }
    })

  } catch (error) {
    console.error('Error fetching grant stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
