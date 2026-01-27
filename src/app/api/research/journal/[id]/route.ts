import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { 
  TeacherStatus, 
  UserRole, 
  JournalStatus,
  JournalScope,
  JournalReviewType,
  JournalAccessType,
  JournalIndexing,
  JournalQuartile,
  JournalPublicationMode
} from '@prisma/client'

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
      journalStatus,
      title,
      journalName,
      imageUrl,
      documentUrl,
      abstract,
      scope,
      reviewType,
      accessType,
      indexing,
      quartile,
      publicationMode,
      impactFactor,
      impactFactorDate,
      publisher,
      publicationDate,
      doi,
      paperLink,
      keywords,
      registrationFees,
      reimbursement,
      teacherStatus,
      isPublic,
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
    if (title !== undefined) updateData.title = title
    if (journalName !== undefined) updateData.journalName = journalName
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (documentUrl !== undefined) updateData.documentUrl = documentUrl
    if (abstract !== undefined) updateData.abstract = abstract
    if (scope !== undefined) updateData.scope = scope
    if (reviewType !== undefined) updateData.reviewType = reviewType
    if (accessType !== undefined) updateData.accessType = accessType
    if (indexing !== undefined) updateData.indexing = indexing
    if (quartile !== undefined) updateData.quartile = quartile
    if (publicationMode !== undefined) updateData.publicationMode = publicationMode
    if (impactFactor !== undefined) updateData.impactFactor = impactFactor ? parseFloat(impactFactor) : null
    if (impactFactorDate !== undefined) updateData.impactFactorDate = impactFactorDate ? new Date(impactFactorDate) : null
    if (publisher !== undefined) updateData.publisher = publisher
    if (publicationDate !== undefined) updateData.publicationDate = publicationDate ? new Date(publicationDate) : null
    if (doi !== undefined) updateData.doi = doi
    if (paperLink !== undefined) updateData.paperLink = paperLink
    if (keywords !== undefined) updateData.keywords = keywords
    if (registrationFees !== undefined) updateData.registrationFees = registrationFees ? parseFloat(registrationFees) : null
    if (reimbursement !== undefined) updateData.reimbursement = reimbursement ? parseFloat(reimbursement) : null
    if (teacherStatus !== undefined) updateData.teacherStatus = teacherStatus
    if (journalStatus !== undefined) updateData.journalStatus = journalStatus
    if (isPublic !== undefined) updateData.isPublic = isPublic

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
