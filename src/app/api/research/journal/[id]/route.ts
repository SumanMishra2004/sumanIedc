import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import {
  getJournalWithAuthors,
  getJournalPermissions,
  canDeleteJournal,
  getNotificationRecipients,
  createNotificationMessage,
} from '@/lib/research/journalHelpers'
import { JournalFacultyRole } from '@prisma/client'

// ─── GET - Get single journal by ID ──────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: journalId } = await params

    const journal = await getJournalWithAuthors(journalId)

    if (!journal) {
      return NextResponse.json({ error: 'Journal not found' }, { status: 404 })
    }

    // Check permissions
    const permissions = getJournalPermissions(
      journal,
      session?.user?.id || null,
      session?.user?.role || null
    )

    if (!permissions.canView) {
      return NextResponse.json(
        { error: 'You do not have permission to view this journal' },
        { status: 403 }
      )
    }

    return NextResponse.json({ journal, permissions })
  } catch (error) {
    console.error('Error fetching journal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PATCH - Update journal ──────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user } = session
    const { id: journalId } = await params
    const body = await req.json()

    // Fetch journal with authors
    const existingJournal = await getJournalWithAuthors(journalId)

    if (!existingJournal) {
      return NextResponse.json({ error: 'Journal not found' }, { status: 404 })
    }

    // Check edit permissions
    const permissions = getJournalPermissions(existingJournal, user.id, user.role)

    if (!permissions.canEdit) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this journal' },
        { status: 403 }
      )
    }

    const {
      title,
      journalName,
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
      imageUrl,
      documentUrl,
      updateComment,
      studentAuthorIds,
      facultyAuthorIds,
      principalInvestigatorId,
    } = body

    // Prepare update data
    const updateData: any = {}

    if (title !== undefined) updateData.title = title
    if (journalName !== undefined) updateData.journalName = journalName
    if (abstract !== undefined) updateData.abstract = abstract
    if (scope !== undefined) updateData.scope = scope
    if (reviewType !== undefined) updateData.reviewType = reviewType
    if (accessType !== undefined) updateData.accessType = accessType
    if (indexing !== undefined) updateData.indexing = indexing
    if (quartile !== undefined) updateData.quartile = quartile
    if (publicationMode !== undefined) updateData.publicationMode = publicationMode
    if (impactFactor !== undefined) updateData.impactFactor = impactFactor
    if (impactFactorDate !== undefined)
      updateData.impactFactorDate = impactFactorDate ? new Date(impactFactorDate) : null
    if (publisher !== undefined) updateData.publisher = publisher
    if (publicationDate !== undefined)
      updateData.publicationDate = publicationDate ? new Date(publicationDate) : null
    if (doi !== undefined) updateData.doi = doi
    if (paperLink !== undefined) updateData.paperLink = paperLink
    if (keywords !== undefined) updateData.keywords = keywords
    if (registrationFees !== undefined) updateData.registrationFees = registrationFees
    if (reimbursement !== undefined) updateData.reimbursement = reimbursement
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (documentUrl !== undefined) updateData.documentUrl = documentUrl
    if (updateComment !== undefined) updateData.updateComment = updateComment

    // Handle author updates (only if provided and user has permission)
    if (studentAuthorIds !== undefined || facultyAuthorIds !== undefined) {
      // Can only update authors if EDITOR/ADMIN/SUPERADMIN or if journal not yet published
      const canUpdateAuthors =
        ['EDITOR', 'ADMIN', 'SUPERADMIN'].includes(user.role) ||
        existingJournal.teacherStatus !== 'PUBLISHED'

      if (!canUpdateAuthors) {
        return NextResponse.json(
          { error: 'Cannot update authors of published journals' },
          { status: 403 }
        )
      }

      // Update student authors
      if (studentAuthorIds !== undefined) {
        await prisma.journalStudentAuthor.deleteMany({
          where: { journalId },
        })

        if (studentAuthorIds.length > 0) {
          await prisma.journalStudentAuthor.createMany({
            data: studentAuthorIds.map((userId: string) => ({
              journalId,
              userId,
            })),
          })
        }
      }

      // Update faculty authors with roles
      if (facultyAuthorIds !== undefined && principalInvestigatorId) {
        await prisma.journalTeacherAuthor.deleteMany({
          where: { journalId },
        })

        if (facultyAuthorIds.length > 0) {
          await prisma.journalTeacherAuthor.createMany({
            data: facultyAuthorIds.map((userId: string) => ({
              journalId,
              userId,
              role:
                userId === principalInvestigatorId
                  ? JournalFacultyRole.PI
                  : JournalFacultyRole.CO_PI,
            })),
          })
        }
      }
    }

    // Update journal
    const updatedJournal = await prisma.journal.update({
      where: { id: journalId },
      data: updateData,
      include: {
        studentAuthors: { include: { user: true } },
        facultyAuthors: { include: { user: true } },
      },
    })

    return NextResponse.json({ journal: updatedJournal })
  } catch (error) {
    console.error('Error updating journal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE - Delete single journal ──────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user } = session
    const { id: journalId } = await params

    // Fetch journal with authors
    const journal = await getJournalWithAuthors(journalId)

    if (!journal) {
      return NextResponse.json({ error: 'Journal not found' }, { status: 404 })
    }

    // Check delete permissions
    if (!canDeleteJournal(journal, user.id, user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this journal' },
        { status: 403 }
      )
    }

    // Delete journal (cascade will handle authors)
    await prisma.journal.delete({
      where: { id: journalId },
    })

    return NextResponse.json({ message: 'Journal deleted successfully' })
  } catch (error) {
    console.error('Error deleting journal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
