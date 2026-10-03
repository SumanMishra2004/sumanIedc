import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import {
  getJournalWithAuthors,
  canPublishJournal,
  canTransitionToStatus,
  validateJournalForStatus,
  getNotificationRecipients,
  createNotificationMessage,
} from '@/lib/research/journalHelpers'
import { TeacherStatus } from '@prisma/client'

/**
 * POST /api/research/journal/[id]/publish
 * EDITOR/ADMIN/SUPERADMIN publishes the journal (makes it public and sets status to PUBLISHED)
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

    // Check permissions - only EDITOR/ADMIN/SUPERADMIN can publish
    if (!canPublishJournal(journal, user.id, user.role)) {
      return NextResponse.json(
        {
          error:
            'Only editors and admins can publish journals, and the journal must be accepted by the PI first',
        },
        { status: 403 }
      )
    }

    // Validate status transition
    const transition = canTransitionToStatus(
      journal.teacherStatus,
      TeacherStatus.PUBLISHED,
      user.role
    )

    if (!transition.allowed) {
      return NextResponse.json(
        { error: transition.reason || 'Cannot publish journal in current status' },
        { status: 400 }
      )
    }

    // Validate journal data before publishing
    const validation = validateJournalForStatus(journal, TeacherStatus.PUBLISHED)

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Journal validation failed',
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    // Update journal status to PUBLISHED and make it public
    const updatedJournal = await prisma.journal.update({
      where: { id: journalId },
      data: {
        teacherStatus: TeacherStatus.PUBLISHED,
        isPublic: true,
        updateComment: null,
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
      actionType: 'published' as const,
      actorName: user.name || user.email || 'Editor',
    }

    const recipients = getNotificationRecipients(
      updatedJournal as any,
      'published',
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
      message: 'Journal published successfully',
    })
  } catch (error) {
    console.error('Error publishing journal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
