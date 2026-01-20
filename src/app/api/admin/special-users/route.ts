import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { addSpecialUser, removeSpecialUser, getAllSpecialUsers } from '@/lib/special-users'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'FACULTY') {
      return NextResponse.json(
        { error: 'Unauthorized - Faculty access required' },
        { status: 403 }
      )
    }

    const specialUsers = await getAllSpecialUsers()
    return NextResponse.json({ specialUsers })
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
    const session = await auth()

    if (!session?.user || session.user.role !== 'FACULTY') {
      return NextResponse.json(
        { error: 'Unauthorized - Faculty access required' },
        { status: 403 }
      )
    }

    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    if (!['STUDENT', 'TEACHER', 'FACULTY'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be STUDENT, TEACHER, or FACULTY' },
        { status: 400 }
      )
    }

    const specialUser = await addSpecialUser(email, role)
    return NextResponse.json({ specialUser }, { status: 201 })
  } catch (error) {
    console.error('Error creating special user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'FACULTY') {
      return NextResponse.json(
        { error: 'Unauthorized - Faculty access required' },
        { status: 403 }
      )
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    await removeSpecialUser(email)
    return NextResponse.json({ message: 'Special user removed successfully' })
  } catch (error) {
    console.error('Error deleting special user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
