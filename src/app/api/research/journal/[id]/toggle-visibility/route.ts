import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getJournalWithAuthors } from '@/lib/research/journalHelpers'

/**
 * PATCH /api/research/journal/[id]/toggle-visibility
 * EDITOR/ADMIN/SUPERADMIN toggles journal public visibility
 */
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

    // Only EDITOR, ADMIN, SUPERADMIN can toggle visibility
    if (!['EDITOR', 'ADMIN', 'SUPERADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Only editors and admins can change journal visibility' },
        { status: 403 }
      )
    }

    // Fetch journal
    const journal = await getJournalWithAuthors(journalId)

    if (!journal) {
      return NextResponse.json({ error: 'Journal not found' }, { status: 404 })
    }

    // Toggle visibility
    const updatedJournal = await prisma.journal.update({
      where: { id: journalId },
      data: {
        isPublic: !journal.isPublic,
      },
      include: {
        studentAuthors: { include: { user: true } },
        facultyAuthors: { include: { user: true } },
      },
    })

    return NextResponse.json({
      journal: updatedJournal,
      message: `Journal is now ${updatedJournal.isPublic ? 'public' : 'private'}`,
    })
  } catch (error) {
    console.error('Error toggling journal visibility:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
