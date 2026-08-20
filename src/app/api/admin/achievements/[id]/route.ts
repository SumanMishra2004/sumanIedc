/**
 * PATCH  /api/admin/achievements/[id]  — EDITOR+ can review; ADMIN+ can also manage
 * DELETE /api/admin/achievements/[id]  — ADMIN+
 *
 * Fixes vs original:
 *  - Changed requireAdmin → requireEditor for review actions (EDITOR is primary reviewer)
 *  - Status transitions validated via workflow engine
 *  - Field allowlist applied (no arbitrary field injection)
 *  - Audit log on every status change
 *  - Centralized notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEditor, requireAdmin, getClientIp } from '@/lib/auth/guard'
import { canApproveAchievement, isAdminOrHigher } from '@/lib/auth/permissions'
import { validateAchievementStatusTransition } from '@/lib/auth/workflow'
import { pickAllowedFields, ACHIEVEMENT_EDITOR_FIELDS } from '@/lib/auth/field-allowlists'
import { AuditActions, writeAuditLog, fromSession } from '@/lib/audit'
import {
  notifyAchievementApproved,
  notifyAchievementRejected,
  notifyAchievementUpdateRequested,
} from '@/lib/notifications'
import { AchievementStatus } from '@prisma/client'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // EDITOR or higher can review achievements
    const guard = await requireEditor(req)
    if (!guard.ok) return guard.response
    const { session } = guard
    const { id } = await params
    const body = await req.json()
    const { role } = session.user
    const ip = await getClientIp(req)

    const achievement = await prisma.achievement.findUnique({ where: { id } })
    if (!achievement) return NextResponse.json({ error: 'Achievement not found' }, { status: 404 })

    const oldStatus = achievement.achievementStatus

    // Field allowlist — reviewer can only set allowed editorial fields
    const safeBody  = pickAllowedFields(body, ACHIEVEMENT_EDITOR_FIELDS) as Record<string, unknown>
    const newStatus = safeBody.achievementStatus as AchievementStatus | undefined

    // Validate transition
    if (newStatus && newStatus !== oldStatus) {
      const transition = validateAchievementStatusTransition(role, oldStatus, newStatus)
      if (!transition.allowed) {
        return NextResponse.json(
          { error: (transition as { allowed: false; reason: string }).reason },
          { status: (transition as { allowed: false; status: number }).status },
        )
      }

      if (newStatus === AchievementStatus.APPROVED && !canApproveAchievement(role)) {
        return NextResponse.json({ error: 'Forbidden — only EDITOR or higher can approve achievements' }, { status: 403 })
      }

      // Approval → make public
      if (newStatus === AchievementStatus.APPROVED) safeBody.isPublic = true
      // Rejection → remove from public
      if (newStatus === AchievementStatus.REJECTED)  safeBody.isPublic = false
    }

    const updated = await prisma.achievement.update({
      where: { id },
      data:  safeBody,
      include: { user: { select: { id: true, name: true, email: true, image: true, department: true, role: true } } },
    })

    if (newStatus && newStatus !== oldStatus) {
      await writeAuditLog({
        ...fromSession(session as { user: { id: string; email: string; role: string } }),
        action:       newStatus === AchievementStatus.APPROVED
          ? AuditActions.ACHIEVEMENT_APPROVED
          : AuditActions.ACHIEVEMENT_REJECTED,
        resourceType: 'Achievement',
        resourceId:   id,
        oldValue:     { status: oldStatus },
        newValue:     { status: newStatus },
        ipAddress:    ip,
      })

      const updateComment = safeBody.updateComment as string | undefined

      if (newStatus === AchievementStatus.APPROVED) {
        await notifyAchievementApproved({ achievementId: id, title: achievement.title, userId: achievement.userId })
      } else if (newStatus === AchievementStatus.REJECTED) {
        await notifyAchievementRejected({ achievementId: id, title: achievement.title, userId: achievement.userId, reason: updateComment })
      } else if (newStatus === AchievementStatus.SUBMITTED && updateComment) {
        await notifyAchievementUpdateRequested({ achievementId: id, title: achievement.title, userId: achievement.userId, updateComment })
      }
    }

    return NextResponse.json({ achievement: updated })
  } catch (error) {
    console.error('[Admin Achievement PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Hard delete requires ADMIN+
    const guard = await requireAdmin(req)
    if (!guard.ok) return guard.response
    const { id } = await params

    const achievement = await prisma.achievement.findUnique({ where: { id } })
    if (!achievement) return NextResponse.json({ error: 'Achievement not found' }, { status: 404 })

    await prisma.achievement.delete({ where: { id } })
    return NextResponse.json({ message: 'Achievement deleted successfully' })
  } catch (error) {
    console.error('[Admin Achievement DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
