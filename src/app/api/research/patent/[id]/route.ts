import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { PatentStatus, TeacherStatus, UserRole } from '@prisma/client'

// GET - Get single patent by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    const patent = await prisma.patent.findUnique({
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

    if (!patent) {
      return NextResponse.json(
        { error: 'Patent not found' },
        { status: 404 }
      )
    }

    // Access control - check if user can view
    if (!patent.isPublic) {
      // Private patent - check authorization
      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized - Please sign in to view this patent' },
          { status: 401 }
        )
      }

      // Allow admins
      const isAdmin = session.user.role === UserRole.ADMIN

      // Check if user is one of the authors
      const isStudentAuthor = patent.studentAuthors.some(
        author => author.user.email === session.user.email
      )
      const isFacultyAuthor = patent.facultyAuthors.some(
        author => author.user.email === session.user.email
      )

      if (!isAdmin && !isStudentAuthor && !isFacultyAuthor) {
        return NextResponse.json(
          { error: 'Unauthorized to view this patent' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ patent })
  } catch (error) {
    console.error('Error fetching patent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update patent
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
      title,
      abstract,
      imageUrl,
      documentUrl,
      patentStatus,
      teacherStatus,
      grantedPatentNo,
      applicationNo,
      patentLink,
      isPublic,
      keywords,
      filingDate,
      submissionDate,
      publicationDate,
      grantDate,
      studentAuthorIds,
      facultyAuthorIds
    } = body

    // Check if patent exists
    const existingPatent = await prisma.patent.findUnique({
      where: { id }
    })

    if (!existingPatent) {
      return NextResponse.json(
        { error: 'Patent not found' },
        { status: 404 }
      )
    }

    // Update patent
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (abstract !== undefined) updateData.abstract = abstract
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (documentUrl !== undefined) updateData.documentUrl = documentUrl
    if (patentStatus !== undefined) updateData.patentStatus = patentStatus
    if (teacherStatus !== undefined) updateData.teacherStatus = teacherStatus
    if (grantedPatentNo !== undefined) updateData.grantedPatentNo = grantedPatentNo
    if (applicationNo !== undefined) updateData.applicationNo = applicationNo
    if (patentLink !== undefined) updateData.patentLink = patentLink
    if (isPublic !== undefined) updateData.isPublic = isPublic
    if (keywords !== undefined) updateData.keywords = keywords
    
    if (filingDate !== undefined) updateData.filingDate = filingDate ? new Date(filingDate) : null
    if (submissionDate !== undefined) updateData.submissionDate = submissionDate ? new Date(submissionDate) : null
    if (publicationDate !== undefined) updateData.publicationDate = publicationDate ? new Date(publicationDate) : null
    if (grantDate !== undefined) updateData.grantDate = grantDate ? new Date(grantDate) : null

    // Update authors if provided
    if (studentAuthorIds !== undefined) {
      // Delete existing student authors
      await prisma.patentStudentAuthor.deleteMany({
        where: { patentId: id }
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
      await prisma.patentTeacherAuthor.deleteMany({
        where: { patentId: id }
      })
      // Create new faculty authors
      updateData.facultyAuthors = {
        create: (facultyAuthorIds || []).map((userId: string) => ({
          userId
        }))
      }
    }

    const patent = await prisma.patent.update({
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

    return NextResponse.json({ patent })
  } catch (error) {
    console.error('Error updating patent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete single patent
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

    const patent = await prisma.patent.findUnique({
      where: { id }
    })

    if (!patent) {
      return NextResponse.json(
        { error: 'Patent not found' },
        { status: 404 }
      )
    }

    await prisma.patent.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Patent deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting patent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
