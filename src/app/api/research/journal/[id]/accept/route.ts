import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import {
  getJournalWithAuthors,
  canUpdateJournalStatus,
  canTransitionToStatus,
  getNotificationRecipients,
  createNotificationMessage,
} from '@/lib/research/journalHelpers'
import { TeacherStatus } from '@prisma/client'

/**
 * POST /api/research/journal/[id]/accept
 * PI accepts the journal submission
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

    // Check permissions - only PI can accept
    if (!canUpdateJournalStatus(journal, user.id, user.role)) {
      return NextResponse.json(
        { error: 'Only the Principal Investigator can accept this journal' },
        { status: 403 }
      )
    }

    // Validate status transition
    const transition = canTransitionToStatus(
      journal.teacherStatus,
      TeacherStatus.ACCEPTED,
      user.role
    )

    if (!transition.allowed) {
      return NextResponse.json(
        { error: transition.reason || 'Cannot accept journal in current status' },
        { status: 400 }
      )
    }

    // Update journal status
    const updatedJournal = await prisma.journal.update({
      where: { id: journalId },
      data: {
        teacherStatus: TeacherStatus.ACCEPTED,
        updateComment: null, // Clear any previous update comments
      },
      include: {
        studentAuthors: { include: { user: true } },
        facultyAuthors: { include: { user: true } },
      },
    })

    // Send notifications to all authors
    const notificationData = {
      journalId: journal.id,
      journalTitle: journal.title,
      actionType: 'accepted' as const,
      actorName: user.name || user.email || 'PI',
    }

    const recipients = getNotificationRecipients(
      updatedJournal as any,
      'accepted',
      user.id
    )
    const notification = createNotificationMessage(notificationData)

    await Promise.all(
      recipients.map((recipientId) =>
        prisma.notification.create({
          data: {
            userId: recipientId,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            link: notification.link,
          },
        })
      )
    )

    return NextResponse.json({
      journal: updatedJournal,
      message: 'Journal accepted successfully',
    })
  } catch (error) {
    console.error('Error accepting journal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
