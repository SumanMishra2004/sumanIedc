import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ResearchStatus, UserRole } from '@prisma/client'

// GET - Get single book chapter by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    const { id } = params

    const bookChapter = await prisma.bookChapter.findUnique({
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

    if (!bookChapter) {
      return NextResponse.json(
        { error: 'Book chapter not found' },
        { status: 404 }
      )
    }

    // Access control - check if user can view
    if (!bookChapter.isPublic && (!session || session.user.role === UserRole.STUDENT)) {
      return NextResponse.json(
        { error: 'Unauthorized to view this book chapter' },
        { status: 403 }
      )
    }

    return NextResponse.json({ bookChapter })
  } catch (error) {
    console.error('Error fetching book chapter:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update book chapter
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const {
      title,
      abstract,
      imageUrl,
      documentUrl,
      status,
      isbnIssn,
      registrationFees,
      reimbursement,
      isPublic,
      keywords,
      doi,
      publicationDate,
      publisher,
      studentAuthorIds,
      facultyAuthorIds
    } = body

    // Check if book chapter exists
    const existingChapter = await prisma.bookChapter.findUnique({
      where: { id }
    })

    if (!existingChapter) {
      return NextResponse.json(
        { error: 'Book chapter not found' },
        { status: 404 }
      )
    }

    // Update book chapter
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (abstract !== undefined) updateData.abstract = abstract
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (documentUrl !== undefined) updateData.documentUrl = documentUrl
    if (status !== undefined) updateData.status = status
    if (isbnIssn !== undefined) updateData.isbnIssn = isbnIssn
    if (registrationFees !== undefined) updateData.registrationFees = parseFloat(registrationFees)
    if (reimbursement !== undefined) updateData.reimbursement = parseFloat(reimbursement)
    if (isPublic !== undefined) updateData.isPublic = isPublic
    if (keywords !== undefined) updateData.keywords = keywords
    if (doi !== undefined) updateData.doi = doi
    if (publicationDate !== undefined) updateData.publicationDate = publicationDate ? new Date(publicationDate) : null
    if (publisher !== undefined) updateData.publisher = publisher

    // Update authors if provided
    if (studentAuthorIds !== undefined) {
      // Delete existing student authors
      await prisma.bookChapterStudentAuthor.deleteMany({
        where: { bookChapterId: id }
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
      await prisma.bookChapterTeacherAuthor.deleteMany({
        where: { bookChapterId: id }
      })
      // Create new faculty authors
      updateData.facultyAuthors = {
        create: (facultyAuthorIds || []).map((userId: string) => ({
          userId
        }))
      }
    }

    const bookChapter = await prisma.bookChapter.update({
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

    return NextResponse.json({ bookChapter })
  } catch (error) {
    console.error('Error updating book chapter:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete single book chapter
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role === UserRole.STUDENT) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin or Faculty access required' },
        { status: 403 }
      )
    }

    const { id } = params

    const bookChapter = await prisma.bookChapter.findUnique({
      where: { id }
    })

    if (!bookChapter) {
      return NextResponse.json(
        { error: 'Book chapter not found' },
        { status: 404 }
      )
    }

    await prisma.bookChapter.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Book chapter deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting book chapter:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
