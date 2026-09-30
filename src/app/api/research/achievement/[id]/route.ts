/**
 * GET    /api/research/achievement/[id]  — owner or EDITOR+ 
 * PATCH  /api/research/achievement/[id]  — owner edits (field allowlist) OR EDITOR+ reviews
 * DELETE /api/research/achievement/[id]  — owner (if not APPROVED) or ADMIN+
 *
 * Security:
 *  - Explicit field allowlist for owner vs reviewer (no mass assignment)
 *  - Status transitions validated via workflow engine
 *  - EDITOR+ can review/approve/reject (fixes isAdminOrHigher bug)
 *  - Owner cannot set achievementStatus = APPROVED directly
 *  - Audit log on status changes
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, getClientIp } from '@/lib/auth/guard'
import { canApproveAchievement, isAdminOrHigher, isEditorOrHigher } from '@/lib/auth/permissions'
import { validateAchievementStatusTransition } from '@/lib/auth/workflow'
import {
  pickAllowedFields,
  ACHIEVEMENT_OWNER_FIELDS,
  ACHIEVEMENT_EDITOR_FIELDS,
} from '@/lib/auth/field-allowlists'
import { AuditActions, writeAuditLog, fromSession } from '@/lib/audit'
import {
  notifyAchievementApproved,
  notifyAchievementRejected,
  notifyAchievementUpdateRequested,
} from '@/lib/notifications'
import { AchievementStatus, UserRole } from '@prisma/client'

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await requireAuth(req)
    if (!guard.ok) return guard.response
    const { session } = guard
    const { id } = await params

    const achievement = await prisma.achievement.findUnique({ where: { id } })
    if (!achievement) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Owner always has access; EDITOR+ can review any; others get 404
    const isOwner    = achievement.userId === session.user.id
    const isReviewer = isEditorOrHigher(session.user.role)

    if (!isOwner && !isReviewer) {
      // Return public approved achievements to any auth user; else 404
      if (achievement.isPublic && achievement.achievementStatus === AchievementStatus.APPROVED) {
        return NextResponse.json({ achievement })
      }
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ achievement })
  } catch (error) {
    console.error('[Achievement GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await requireAuth(req)
    if (!guard.ok) return guard.response
    const { session } = guard
    const { id } = await params
    const body = await req.json()
    const { role, id: userId } = session.user
    const ip = await getClientIp(req)

    const achievement = await prisma.achievement.findUnique({ where: { id } })
    if (!achievement) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const isOwner    = achievement.userId === userId
    const isReviewer = isEditorOrHigher(role)

    if (!isOwner && !isReviewer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const oldStatus = achievement.achievementStatus

    // ── Owner path ───────────────────────────────────────────────────────────
    if (isOwner && !isReviewer) {
      // Owner cannot edit APPROVED achievements
      if (achievement.achievementStatus === AchievementStatus.APPROVED) {
        return NextResponse.json({ error: 'Approved achievements cannot be modified' }, { status: 400 })
      }

      // Field allowlist — owner cannot touch status, isPublic, updateComment
      const safeBody = pickAllowedFields(body, ACHIEVEMENT_OWNER_FIELDS) as Record<string, unknown>

      // After owner edits, reset to SUBMITTED for re-review
      const updateData = { ...safeBody, achievementStatus: AchievementStatus.SUBMITTED }

      const updated = await prisma.achievement.update({ where: { id }, data: updateData })
      return NextResponse.json({ achievement: updated })
    }

    // ── Reviewer path (EDITOR/ADMIN/SUPERADMIN) ──────────────────────────────
    const safeBody   = pickAllowedFields(body, ACHIEVEMENT_EDITOR_FIELDS) as Record<string, unknown>
    const newStatus  = safeBody.achievementStatus as AchievementStatus | undefined

    // Validate status transition
    if (newStatus && newStatus !== oldStatus) {
      const transition = validateAchievementStatusTransition(role, oldStatus, newStatus)
      if (!transition.allowed) {
        return NextResponse.json(
          { error: (transition as { allowed: false; reason: string }).reason },
          { status: (transition as { allowed: false; status: number }).status },
        )
      }
      // Enforce that only EDITOR+ can approve
      if (newStatus === AchievementStatus.APPROVED && !canApproveAchievement(role)) {
        return NextResponse.json({ error: 'Forbidden — only EDITOR or higher can approve achievements' }, { status: 403 })
      }
      // Approval forces isPublic = true
      if (newStatus === AchievementStatus.APPROVED) {
        safeBody.isPublic = true
      }
      // Rejection / update_request clears isPublic
      if (newStatus === AchievementStatus.REJECTED || newStatus === AchievementStatus.SUBMITTED) {
        safeBody.isPublic = false
      }
    }

    const updated = await prisma.achievement.update({ where: { id }, data: safeBody })

    // Audit + notifications on status change
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
    console.error('[Achievement PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await requireAuth(req)
    if (!guard.ok) return guard.response
    const { session } = guard
    const { id } = await params
    const { role, id: userId } = session.user

    const achievement = await prisma.achievement.findUnique({ where: { id } })
    if (!achievement) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const isOwner = achievement.userId === userId
    const isAdmin = isAdminOrHigher(role)

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Owners cannot delete APPROVED achievements
    if (isOwner && !isAdmin && achievement.achievementStatus === AchievementStatus.APPROVED) {
      return NextResponse.json({ error: 'Approved achievements cannot be deleted' }, { status: 400 })
    }

    await prisma.achievement.delete({ where: { id } })
    return NextResponse.json({ message: 'Achievement deleted successfully' })
  } catch (error) {
    console.error('[Achievement DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
