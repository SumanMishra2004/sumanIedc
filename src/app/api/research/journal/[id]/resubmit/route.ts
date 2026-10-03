import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import {
  getJournalWithAuthors,
  canResubmitJournal,
  canTransitionToStatus,
  getNotificationRecipients,
  createNotificationMessage,
  isPI,
} from '@/lib/research/journalHelpers'
import { TeacherStatus } from '@prisma/client'

/**
 * POST /api/research/journal/[id]/resubmit
 * Authors resubmit journal after requested updates
 */
export async function POST(
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

    // Check permissions — only actual authors (student/faculty) can resubmit, not editors/admins
    if (!canResubmitJournal(journal, user.id, user.role)) {
      return NextResponse.json(
        { error: 'Only the journal authors can resubmit' },
        { status: 403 }
      )
    }

    // Must be in UPDATE status to resubmit (also enforced inside canResubmitJournal, but keep explicit check for clear error message)
    if (journal.teacherStatus !== TeacherStatus.UPDATE) {
      return NextResponse.json(
        { error: 'Journal must be in UPDATE status to resubmit' },
        { status: 400 }
      )
    }

    // Validate status transition
    const transition = canTransitionToStatus(
      journal.teacherStatus,
      TeacherStatus.UPLOADED,
      user.role
    )

    if (!transition.allowed) {
      return NextResponse.json(
        { error: transition.reason || 'Cannot resubmit journal' },
        { status: 400 }
      )
    }

    // Update journal status back to UPLOADED for PI review
    const updatedJournal = await prisma.journal.update({
      where: { id: journalId },
      data: {
        teacherStatus: TeacherStatus.UPLOADED,
        updateComment: null, // Clear update comment after resubmission
      },
      include: {
        studentAuthors: { include: { user: true } },
        facultyAuthors: { include: { user: true } },
      },
    })

    // Send notification to PI
    const notificationData = {
      journalId: journal.id,
      journalTitle: journal.title,
      actionType: 'submitted' as const,
      actorName: user.name || user.email || 'Author',
    }

    // Find PI and notify
    const piAuthor = updatedJournal.facultyAuthors.find((a) => a.role === 'PI')
    if (piAuthor?.userId && piAuthor.userId !== user.id) {
      const notification = createNotificationMessage(notificationData)

      await prisma.notification.create({
        data: {
          userId: piAuthor.userId,
          title: 'Journal Resubmitted',
          message: `${notificationData.actorName} has resubmitted the journal "${journal.title}" for your review after making requested updates.`,
          type: 'journal_resubmitted',
          link: notification.link,
        },
      })
    }

    return NextResponse.json({
      journal: updatedJournal,
      message: 'Journal resubmitted successfully',
    })
  } catch (error) {
    console.error('Error resubmitting journal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
