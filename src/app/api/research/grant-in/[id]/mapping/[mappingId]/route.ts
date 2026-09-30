/**
 * DELETE /api/research/grant-in/[id]/mapping/[mappingId]
 *
 * Remove a publication mapping from a grant.
 *
 * Only PI/CoPI or ADMIN+ can delete mappings.
 * 404 returned when the mapping doesn't belong to this grant (avoids leaking existence).
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { GrantInRole } from '@prisma/client'
import { isAdminOrHigher } from '@/lib/auth/permissions'
import { AuditActions, writeAuditLog, fromSession } from '@/lib/audit'
import { getClientIp } from '@/lib/auth/guard'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; mappingId: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: grantId, mappingId } = await params
    const userId   = session.user.id
    const userRole = session.user.role
    const ip       = await getClientIp(req)

    // Verify mapping belongs to this grant
    const mapping = await prisma.grantInMapping.findFirst({
      where: { id: mappingId, grantInId: grantId },
    })

    if (!mapping) {
      return NextResponse.json({ error: 'Mapping not found' }, { status: 404 })
    }

    // Only PI/CoPI or ADMIN+ can remove mappings
    const isAdmin = isAdminOrHigher(userRole)
    if (!isAdmin) {
      const piEntry = await prisma.grantInTeacherAuthor.findFirst({
        where: {
          grantInId: grantId,
          userId,
          role: { in: [GrantInRole.FACULTY_PI, GrantInRole.FACULTY_COPI] },
        },
      })
      if (!piEntry) {
        return NextResponse.json(
          { error: 'Only the grant PI, Co-PI, or an administrator can remove publication mappings' },
          { status: 403 },
        )
      }
    }

    await prisma.grantInMapping.delete({ where: { id: mappingId } })

    writeAuditLog({
      ...fromSession(session as { user: { id: string; email: string; role: string } }),
      action:       AuditActions.GRANT_MAPPING_DELETED,
      resourceType: 'GrantInMapping',
      resourceId:   mappingId,
      oldValue:     {
        grantId,
        publicationType: mapping.publicationType,
        journalId:       mapping.journalId,
        conferenceId:    mapping.conferenceId,
        bookChapterId:   mapping.bookChapterId,
        patentId:        mapping.patentId,
        copyrightId:     mapping.copyrightId,
      },
      ipAddress: ip,
    }).catch(() => {})

    return NextResponse.json({ message: 'Mapping removed successfully' })
  } catch (error) {
    console.error('[GrantMapping DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
