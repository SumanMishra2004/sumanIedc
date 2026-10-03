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
 * POST /api/research/journal/[id]/request-update
 * PI requests updates to the journal submission
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
    const body = await req.json()
    const { updateComment } = body

    if (!updateComment || updateComment.trim() === '') {
      return NextResponse.json(
        { error: 'Update instructions are required' },
        { status: 400 }
      )
    }

    // Fetch journal with authors
    const journal = await getJournalWithAuthors(journalId)

    if (!journal) {
      return NextResponse.json({ error: 'Journal not found' }, { status: 404 })
    }

    // Check permissions - only PI can request updates
    if (!canUpdateJournalStatus(journal, user.id, user.role)) {
      return NextResponse.json(
        { error: 'Only the Principal Investigator can request updates to this journal' },
        { status: 403 }
      )
    }

    // Validate status transition
    const transition = canTransitionToStatus(
      journal.teacherStatus,
      TeacherStatus.UPDATE,
      user.role
    )

    if (!transition.allowed) {
      return NextResponse.json(
        { error: transition.reason || 'Cannot request update in current status' },
        { status: 400 }
      )
    }

    // Update journal status
    const updatedJournal = await prisma.journal.update({
      where: { id: journalId },
      data: {
        teacherStatus: TeacherStatus.UPDATE,
        updateComment,
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
      actionType: 'update_requested' as const,
      actorName: user.name || user.email || 'PI',
      message: updateComment,
    }

    const recipients = getNotificationRecipients(
      updatedJournal as any,
      'update_requested',
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
      message: 'Update request sent successfully',
    })
  } catch (error) {
    console.error('Error requesting journal update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
