import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req:NextRequest) {
  try {
    // const session = await auth()

    // if (!session?.user || session.user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'Unauthorized - ADMIN access required' },
    //     { status: 403 }
    //   )
    // }
   
      const all_user = await prisma.specialUser.findMany({
        orderBy: {
          id: 'asc'
        }
      });
      return NextResponse.json({ all_user });
  } catch (error) {
    console.error('Error fetching special users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // const session = await auth()

    // if (!session?.user || session.user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'Unauthorized - ADMIN access required' },
    //     { status: 403 }
    //   )
    // }

    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    if (!['STUDENT', 'ADMIN', 'FACULTY'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be STUDENT, ADMIN, or FACULTY' },
        { status: 400 }
      )
    }

    const specialUser = await prisma.specialUser.create({
      data: {
        email,
        role,
      },
    })
    return NextResponse.json({ specialUser }, { status: 201 })
  } catch (error) {
    console.error('Error creating special user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    // const session = await auth()

    // if (!session?.user || session.user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'Unauthorized - ADMIN access required' },
    //     { status: 403 }
    //   )
    // }

    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    if (!['STUDENT', 'ADMIN', 'FACULTY'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be STUDENT, ADMIN, or FACULTY' },
        { status: 400 }
      )
    }

    const specialUser = await prisma.specialUser.update({
      where: { email },
      data: { role },
    })

    return NextResponse.json({ specialUser })
  } catch (error) {
    console.error('Error updating special user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    // const session = await auth()

    // if (!session?.user || session.user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'Unauthorized - ADMIN access required' },
    //     { status: 403 }
    //   )
    // }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    await prisma.specialUser.delete({
      where: { email },
    })
    return NextResponse.json({ message: 'Special user removed successfully' })
  } catch (error) {
    console.error('Error deleting special user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
