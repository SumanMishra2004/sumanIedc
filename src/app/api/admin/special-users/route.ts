import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { isAdminOrHigher, canAssignRole, type UserRoleString } from '@/lib/auth/permissions'

const VALID_ROLES: UserRoleString[] = ['STUDENT', 'FACULTY', 'EDITOR', 'ADMIN', 'SUPERADMIN']

async function requireAdminOrHigher() {
  const session = await auth()
  if (!session?.user || !isAdminOrHigher(session.user.role)) {
    return null
  }
  return session
}

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAdminOrHigher()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized — ADMIN access required' },
        { status: 403 }
      )
    }

    const all_user = await prisma.specialUser.findMany({
      orderBy: { id: 'asc' },
    })
    return NextResponse.json({ all_user })
  } catch (error) {
    console.error('Error fetching special users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminOrHigher()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized — ADMIN access required' },
        { status: 403 }
      )
    }

    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 })
    }

    const upperRole = (role as string).toUpperCase() as UserRoleString
    if (!VALID_ROLES.includes(upperRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      )
    }

    // Enforce role assignment matrix — ADMIN cannot pre-assign SUPERADMIN
    if (!canAssignRole(session.user.role, upperRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to assign this role' },
        { status: 403 }
      )
    }

    const specialUser = await prisma.specialUser.create({
      data: { email, role: upperRole },
    })
    return NextResponse.json({ specialUser }, { status: 201 })
  } catch (error) {
    console.error('Error creating special user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAdminOrHigher()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized — ADMIN access required' },
        { status: 403 }
      )
    }

    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 })
    }

    const upperRole = (role as string).toUpperCase() as UserRoleString
    if (!VALID_ROLES.includes(upperRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      )
    }

    // Enforce role assignment matrix
    if (!canAssignRole(session.user.role, upperRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to assign this role' },
        { status: 403 }
      )
    }

    const specialUser = await prisma.specialUser.update({
      where: { email },
      data: { role: upperRole },
    })

    return NextResponse.json({ specialUser })
  } catch (error) {
    console.error('Error updating special user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireAdminOrHigher()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized — ADMIN access required' },
        { status: 403 }
      )
    }

    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // ADMIN cannot remove a SUPERADMIN from the special-user table
    const existing = await prisma.specialUser.findUnique({ where: { email } })
    if (existing && existing.role === 'SUPERADMIN' && !canAssignRole(session.user.role, 'SUPERADMIN')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to modify a SUPERADMIN entry' },
        { status: 403 }
      )
    }

    await prisma.specialUser.delete({ where: { email } })
    return NextResponse.json({ message: 'Special user removed successfully' })
  } catch (error) {
    console.error('Error deleting special user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
