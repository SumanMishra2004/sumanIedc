import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ResearchStatus, UserRole, JournalType } from '@prisma/client'

// GET - Get single journal by ID
export async function GET(
  req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    const journal = await prisma.journal.findUnique({
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

    if (!journal) {
      return NextResponse.json(
        { error: 'Journal not found' },
        { status: 404 }
      )
    }

    // Access control - check if user can view
    if (!journal.isPublic && (!session || session.user.role === UserRole.STUDENT)) {
      return NextResponse.json(
        { error: 'Unauthorized to view this journal' },
        { status: 403 }
      )
    }

    return NextResponse.json({ journal })
  } catch (error) {
    console.error('Error fetching journal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update journal
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
      serialNo,
      titleOfJournal,
      title,
      journalType,
      impactFactor,
      dateOfImpactFactor,
      journalPublisher,
      status,
      paperLink,
      doi,
      registrationFees,
      reimbursement,
      isPublic,
      abstract,
      imageUrl,
      documentUrl,
      publicationDate,
      keywords,
      studentAuthorIds,
      facultyAuthorIds
    } = body

    // Check if journal exists
    const existingJournal = await prisma.journal.findUnique({
      where: { id }
    })

    if (!existingJournal) {
      return NextResponse.json(
        { error: 'Journal not found' },
        { status: 404 }
      )
    }

    // If serialNo is being changed, check for duplicates
    if (serialNo && serialNo !== existingJournal.serialNo) {
      const duplicateSerialNo = await prisma.journal.findUnique({
        where: { serialNo }
      })

      if (duplicateSerialNo) {
        return NextResponse.json(
          { error: 'A journal with this serial number already exists' },
          { status: 400 }
        )
      }
    }

    // Update journal
    const updateData: any = {}
    if (serialNo !== undefined) updateData.serialNo = serialNo
    if (titleOfJournal !== undefined) updateData.titleOfJournal = titleOfJournal
    if (title !== undefined) updateData.title = title
    if (journalType !== undefined) updateData.journalType = journalType
    if (impactFactor !== undefined) updateData.impactFactor = impactFactor ? parseFloat(impactFactor) : null
    if (dateOfImpactFactor !== undefined) updateData.dateOfImpactFactor = dateOfImpactFactor ? new Date(dateOfImpactFactor) : null
    if (journalPublisher !== undefined) updateData.journalPublisher = journalPublisher
    if (status !== undefined) updateData.status = status
    if (paperLink !== undefined) updateData.paperLink = paperLink
    if (doi !== undefined) updateData.doi = doi
    if (registrationFees !== undefined) updateData.registrationFees = registrationFees ? parseFloat(registrationFees) : null
    if (reimbursement !== undefined) updateData.reimbursement = reimbursement ? parseFloat(reimbursement) : null
    if (isPublic !== undefined) updateData.isPublic = isPublic
    if (abstract !== undefined) updateData.abstract = abstract
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (documentUrl !== undefined) updateData.documentUrl = documentUrl
    if (publicationDate !== undefined) updateData.publicationDate = publicationDate ? new Date(publicationDate) : null
    if (keywords !== undefined) updateData.keywords = keywords

    // Update authors if provided
    if (studentAuthorIds !== undefined) {
      // Delete existing student authors
      await prisma.journalStudentAuthor.deleteMany({
        where: { journalId: id }
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
      await prisma.journalTeacherAuthor.deleteMany({
        where: { journalId: id }
      })
      // Create new faculty authors
      updateData.facultyAuthors = {
        create: (facultyAuthorIds || []).map((userId: string) => ({
          userId
        }))
      }
    }

    const journal = await prisma.journal.update({
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

    return NextResponse.json({ journal })
  } catch (error) {
    console.error('Error updating journal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete single journal
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

    const journal = await prisma.journal.findUnique({
      where: { id }
    })

    if (!journal) {
      return NextResponse.json(
        { error: 'Journal not found' },
        { status: 404 }
      )
    }

    await prisma.journal.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Journal deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting journal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
