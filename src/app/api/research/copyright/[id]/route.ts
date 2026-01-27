import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { UserRole } from '@prisma/client'

// GET - Get single copyright by ID
export async function GET(
  req: NextRequest,
 { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const { id } = await  params

    const copyright = await prisma.copyright.findUnique({
      where: { id },
      include: {
        studentAuthors: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        facultyAuthors: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      }
    })

    if (!copyright) {
      return NextResponse.json(
        { error: 'Copyright not found' },
        { status: 404 }
      )
    }

    // Access control - check if user can view
    if (!copyright.isPublic && (!session || session.user.role === UserRole.STUDENT)) {
      return NextResponse.json(
        { error: 'Unauthorized to view this copyright' },
        { status: 403 }
      )
    }

    return NextResponse.json({ copyright })
  } catch (error) {
    console.error('Error fetching copyright:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update copyright
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } =await  params
    const body = await request.json()
    const {
      regNo,
      title,
      abstract,
      imageUrl,
      documentUrl,
      dateOfFiling,
      dateOfSubmission,
      dateOfPublished,
      dateOfGrant,
      registrationFees,
      reimbursement,
      copyrightStatus,
      teacherStatus,
      isPublic,
      studentAuthorIds,
      facultyAuthorIds
    } = body

    // Check if copyright exists
    const existingCopyright = await prisma.copyright.findUnique({
      where: { id }
    })

    if (!existingCopyright) {
      return NextResponse.json(
        { error: 'Copyright not found' },
        { status: 404 }
      )
    }

    // Update copyright
    const updateData: any = {}
    if (regNo !== undefined) updateData.regNo = regNo
    if (title !== undefined) updateData.title = title
    if (abstract !== undefined) updateData.abstract = abstract
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (documentUrl !== undefined) updateData.documentUrl = documentUrl
    if (dateOfFiling !== undefined) updateData.dateOfFiling = dateOfFiling ? new Date(dateOfFiling) : null
    if (dateOfSubmission !== undefined) updateData.dateOfSubmission = dateOfSubmission ? new Date(dateOfSubmission) : null
    if (dateOfPublished !== undefined) updateData.dateOfPublished = dateOfPublished ? new Date(dateOfPublished) : null
    if (dateOfGrant !== undefined) updateData.dateOfGrant = dateOfGrant ? new Date(dateOfGrant) : null
    if (registrationFees !== undefined) updateData.registrationFees = parseFloat(registrationFees)
    if (reimbursement !== undefined) updateData.reimbursement = parseFloat(reimbursement)
    if (copyrightStatus !== undefined) updateData.copyrightStatus = copyrightStatus
    if (teacherStatus !== undefined) updateData.teacherStatus = teacherStatus
    if (isPublic !== undefined) updateData.isPublic = isPublic

    // Update authors if provided
    if (studentAuthorIds !== undefined) {
      // Delete existing student authors
      await prisma.copyrightStudentAuthor.deleteMany({
        where: { copyrightId: id }
      })
      // Create new student authors
      updateData.studentAuthors = {
        create: (studentAuthorIds || []).map((userId: string) => ({
          userId
        }))
      }
    }

    if (facultyAuthorIds !== undefined) {
      // Delete existing faculty authors
      await prisma.copyrightTeacherAuthor.deleteMany({
        where: { copyrightId: id }
      })
      // Create new faculty authors
      updateData.facultyAuthors = {
        create: (facultyAuthorIds || []).map((userId: string) => ({
          userId
        }))
      }
    }

    const copyright = await prisma.copyright.update({
      where: { id },
      data: updateData,
      include: {
        studentAuthors: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        facultyAuthors: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ copyright })
  } catch (error) {
    console.error('Error updating copyright:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete single copyright
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role === UserRole.STUDENT) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin or Faculty access required' },
        { status: 403 }
      )
    }

    const { id } = await params

    const copyright = await prisma.copyright.findUnique({
      where: { id }
    })

    if (!copyright) {
      return NextResponse.json(
        { error: 'Copyright not found' },
        { status: 404 }
      )
    }

    await prisma.copyright.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Copyright deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting copyright:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
