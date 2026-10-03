import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import {
  TeacherStatus,
  JournalStatus,
  JournalScope,
  JournalReviewType,
  JournalAccessType,
  JournalIndexing,
  JournalQuartile,
  JournalPublicationMode
} from '@prisma/client'
import { isAdminOrHigher, isEditorOrHigher } from '@/lib/auth/permissions'

// ADMIN+ guard — used for mutations (PATCH, DELETE)
async function requireAdmin() {
  const session = await auth()
  if (!session?.user || !isAdminOrHigher(session.user.role)) {
    return null
  }
  return session
}

// EDITOR+ guard — used for read-only access
async function requireEditorOrHigher() {
  const session = await auth()
  if (!session?.user || !isEditorOrHigher(session.user.role)) {
    return null
  }
  return session
}

// Author include with department
const authorInclude = {
  studentAuthors: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          department: true
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
          image: true,
          department: true
        }
      }
    }
  }
}

// GET /api/admin/journals/[id] — fetch single journal with authors (EDITOR+)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireEditorOrHigher()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized — EDITOR access required' },
        { status: 403 }
      )
    }

    const { id } = await params

    const journal = await prisma.journal.findUnique({
      where: { id },
      include: authorInclude
    })

    if (!journal) {
      return NextResponse.json(
        { error: 'Journal not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ journal })
  } catch (error) {
    console.error('Error fetching admin journal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Enum validation map
const enumValidators: Record<string, { values: string[]; label: string }> = {
  teacherStatus: { values: Object.values(TeacherStatus), label: 'teacherStatus' },
  journalStatus: { values: Object.values(JournalStatus), label: 'journalStatus' },
  scope: { values: Object.values(JournalScope), label: 'scope' },
  reviewType: { values: Object.values(JournalReviewType), label: 'reviewType' },
  accessType: { values: Object.values(JournalAccessType), label: 'accessType' },
  indexing: { values: Object.values(JournalIndexing), label: 'indexing' },
  quartile: { values: Object.values(JournalQuartile), label: 'quartile' },
  publicationMode: { values: Object.values(JournalPublicationMode), label: 'publicationMode' },
}

// PATCH /api/admin/journals/[id] — update journal fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized — ADMIN access required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await req.json()

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

    const {
      teacherStatus,
      journalStatus,
      isPublic,
      doi,
      publisher,
      impactFactor,
      quartile,
      indexing,
      publicationDate,
      paperLink,
      scope,
      reviewType,
      accessType,
      publicationMode,
      title,
      journalName,
      abstract,
      serialNo,
      imageUrl,
      documentUrl,
      impactFactorDate,
      keywords,
      registrationFees,
      reimbursement,
    } = body

    // Validate enum fields
    for (const [field, validator] of Object.entries(enumValidators)) {
      const value = body[field]
      if (value !== undefined && !validator.values.includes(value)) {
        return NextResponse.json(
          { error: `Invalid ${validator.label} value: ${value}` },
          { status: 400 }
        )
      }
    }

    // If serialNo is being changed, check for duplicates
    if (serialNo !== undefined && serialNo !== existingJournal.serialNo) {
      const duplicate = await prisma.journal.findUnique({
        where: { serialNo }
      })
      if (duplicate) {
        return NextResponse.json(
          { error: 'A journal with this serial number already exists' },
          { status: 400 }
        )
      }
    }

    // Build update data — only include provided fields
    const updateData: any = {}
    if (teacherStatus !== undefined) updateData.teacherStatus = teacherStatus
    if (journalStatus !== undefined) updateData.journalStatus = journalStatus
    if (isPublic !== undefined) updateData.isPublic = Boolean(isPublic)
    if (doi !== undefined) updateData.doi = doi
    if (publisher !== undefined) updateData.publisher = publisher
    if (impactFactor !== undefined) updateData.impactFactor = impactFactor !== null ? parseFloat(impactFactor) : null
    if (quartile !== undefined) updateData.quartile = quartile
    if (indexing !== undefined) updateData.indexing = indexing
    if (publicationDate !== undefined) updateData.publicationDate = publicationDate ? new Date(publicationDate) : null
    if (paperLink !== undefined) updateData.paperLink = paperLink
    if (scope !== undefined) updateData.scope = scope
    if (reviewType !== undefined) updateData.reviewType = reviewType
    if (accessType !== undefined) updateData.accessType = accessType
    if (publicationMode !== undefined) updateData.publicationMode = publicationMode
    if (title !== undefined) updateData.title = title
    if (journalName !== undefined) updateData.journalName = journalName
    if (abstract !== undefined) updateData.abstract = abstract
    if (serialNo !== undefined) updateData.serialNo = serialNo
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (documentUrl !== undefined) updateData.documentUrl = documentUrl
    if (impactFactorDate !== undefined) updateData.impactFactorDate = impactFactorDate ? new Date(impactFactorDate) : null
    if (keywords !== undefined) updateData.keywords = keywords
    if (registrationFees !== undefined) updateData.registrationFees = registrationFees !== null ? parseFloat(registrationFees) : null
    if (reimbursement !== undefined) updateData.reimbursement = reimbursement !== null ? parseFloat(reimbursement) : null

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const journal = await prisma.journal.update({
      where: { id },
      data: updateData,
      include: authorInclude
    })

    return NextResponse.json({ journal })
  } catch (error) {
    console.error('Error updating admin journal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/journals/[id] — hard-delete a journal (ADMIN+)
// Published journals can only be deleted by ADMIN/SUPERADMIN (enforced here via requireAdmin).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized — ADMIN access required' },
        { status: 403 }
      )
    }

    const { id } = await params

    const existing = await prisma.journal.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Journal not found' }, { status: 404 })
    }

    // Extra guard: SUPERADMIN can delete published journals; plain ADMIN cannot
    if (
      existing.teacherStatus === 'PUBLISHED' &&
      session.user.role !== 'SUPERADMIN'
    ) {
      return NextResponse.json(
        { error: 'Only SUPERADMIN can delete published journals' },
        { status: 403 }
      )
    }

    // Cascade deletes for JournalStudentAuthor and JournalTeacherAuthor are
    // handled by onDelete: Cascade in the schema — no manual cleanup needed.
    await prisma.journal.delete({ where: { id } })

    return NextResponse.json({ message: 'Journal deleted successfully' })
  } catch (error) {
    console.error('Error deleting admin journal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
