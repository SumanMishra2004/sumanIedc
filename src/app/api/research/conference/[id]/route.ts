import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ConferenceStatus, TeacherStatus, UserRole, ConferenceMode } from '@prisma/client'

// GET - Get single conference by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    const conference = await prisma.conference.findUnique({
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

    if (!conference) {
      return NextResponse.json(
        { error: 'Conference not found' },
        { status: 404 }
      )
    }

    // Access control - check if user can view
    if (!conference.isPublic) {
      // Private conference - check authorization
      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized - Please sign in to view this conference' },
          { status: 401 }
        )
      }

      // Allow admins
      const isAdmin = session.user.role === UserRole.ADMIN

      // Check if user is one of the authors
      const isStudentAuthor = conference.studentAuthors.some(
        author => author.user.email === session.user.email
      )
      const isFacultyAuthor = conference.facultyAuthors.some(
        author => author.user.email === session.user.email
      )

      if (!isAdmin && !isStudentAuthor && !isFacultyAuthor) {
        return NextResponse.json(
          { error: 'Unauthorized to view this conference' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ conference })
  } catch (error) {
    console.error('Error fetching conference:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update conference
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

    const { id } = await params
    const body = await request.json()
    const {
      conferenceName,
      paperName,
      abstract,
      imageUrl,
      documentUrl,
      conferenceStatus,
      teacherStatus,
      mode,
      registrationFees,
      reimbursement,
      isPublic,
      keywords,
      paperDoi,
      paperLink,
      conferenceDate,
      conferencePublisher,
      studentAuthorIds,
      facultyAuthorIds
    } = body

    // Check if conference exists
    const existingConference = await prisma.conference.findUnique({
      where: { id }
    })

    if (!existingConference) {
      return NextResponse.json(
        { error: 'Conference not found' },
        { status: 404 }
      )
    }

    // Update conference
    const updateData: any = {}
    if (conferenceName !== undefined) updateData.conferenceName = conferenceName
    if (paperName !== undefined) updateData.paperName = paperName
    if (abstract !== undefined) updateData.abstract = abstract
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (documentUrl !== undefined) updateData.documentUrl = documentUrl
    if (conferenceStatus !== undefined) updateData.conferenceStatus = conferenceStatus
    if (teacherStatus !== undefined) updateData.teacherStatus = teacherStatus
    if (mode !== undefined) updateData.mode = mode
    if (registrationFees !== undefined) updateData.registrationFees = parseFloat(registrationFees)
    if (reimbursement !== undefined) updateData.reimbursement = parseFloat(reimbursement)
    if (isPublic !== undefined) updateData.isPublic = isPublic
    if (keywords !== undefined) updateData.keywords = keywords
    if (paperDoi !== undefined) updateData.paperDoi = paperDoi
    if (paperLink !== undefined) updateData.paperLink = paperLink
    if (conferenceDate !== undefined) updateData.conferenceDate = conferenceDate ? new Date(conferenceDate) : null
    if (conferencePublisher !== undefined) updateData.conferencePublisher = conferencePublisher

    // Update authors if provided
    if (studentAuthorIds !== undefined) {
      // Delete existing student authors
      await prisma.conferenceStudentAuthor.deleteMany({
        where: { conferenceId: id }
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
      await prisma.conferenceTeacherAuthor.deleteMany({
        where: { conferenceId: id }
      })
      // Create new faculty authors
      updateData.facultyAuthors = {
        create: (facultyAuthorIds || []).map((userId: string) => ({
          userId
        }))
      }
    }

    const conference = await prisma.conference.update({
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

    return NextResponse.json({ conference })
  } catch (error) {
    console.error('Error updating conference:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete conference
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user || session.user.role === UserRole.STUDENT) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await prisma.conference.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting conference:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
