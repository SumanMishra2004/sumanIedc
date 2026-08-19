import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { TeacherStatus, UserRole, JournalStatus } from "@prisma/client"
import { journalSchema } from "@/lib/validations/journal"
import { sendNotificationEmail, broadcastPublicationEmail } from "@/lib/mail"
import { canViewAllResearch, isAdminOrHigher, isFacultyOrHigher } from "@/lib/auth/permissions"
// GET - Get single journal by ID with permission checks
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    const journal = await prisma.journal.findUnique({
      where: { id },
      include: {
        studentAuthors: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                department: true,
              },
            },
          },
        },
        facultyAuthors: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                department: true,
              },
            },
          },
        },
      },
    })

    if (!journal) {
      return NextResponse.json(
        { error: "Journal not found" },
        { status: 404 }
      )
    }

    if (!journal.isPublic) {
      if (!session) {
        return NextResponse.json(
          { error: "Unauthorized - Please sign in to view this journal" },
          { status: 401 }
        )
      }

      // Allow admin or higher
      const isPrivileged = canViewAllResearch(session.user.role)

      const isStudentAuthor = journal.studentAuthors.some(
        (author) => author.user?.email === session.user.email
      )
      const isFacultyAuthor = journal.facultyAuthors.some(
        (author) => author.user?.email === session.user.email
      )

      if (!isPrivileged && !isStudentAuthor && !isFacultyAuthor) {
        return NextResponse.json(
          { error: "Unauthorized to view this journal" },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ journal })
  } catch (error) {
    console.error("Error fetching journal:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH - Update journal with role validation, status transition validation and Zod schema
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // 1. Fetch current journal status & author mapping
    const existingJournal = await prisma.journal.findUnique({
      where: { id },
      include: {
        studentAuthors: true,
        facultyAuthors: true,
      },
    })

    if (!existingJournal) {
      return NextResponse.json(
        { error: "Journal not found" },
        { status: 404 }
      )
    }

    const userRole = session.user.role
    const userId = session.user.id

    // 2. Validate user role permissions to modify this specific journal
    if (userRole === UserRole.STUDENT) {
      const isAuthor = existingJournal.studentAuthors.some(
        (sa) => sa.userId === userId
      )
      if (!isAuthor) {
        return NextResponse.json(
          { error: "Unauthorized - You can only edit your own journals" },
          { status: 403 }
        )
      }

      // Students can only edit before publication and when requested update or newly uploaded
      const isLocked =
        existingJournal.journalStatus === JournalStatus.PUBLISHED ||
        existingJournal.teacherStatus === TeacherStatus.ACCEPTED ||
        existingJournal.teacherStatus === TeacherStatus.REJECTED ||
        existingJournal.teacherStatus === TeacherStatus.PUBLISHED

      if (isLocked) {
        return NextResponse.json(
          { error: "This journal is locked and cannot be edited by students" },
          { status: 403 }
        )
      }

      // Prevent student from updating system fields
      delete body.journalStatus
      delete body.teacherStatus
      delete body.isPublic
    } else if (userRole === UserRole.FACULTY || userRole === UserRole.EDITOR) {
      // FACULTY and EDITOR act as reviewers — must be in facultyAuthors
      const isAssignedReviewer = existingJournal.facultyAuthors.some(
        (fa) => fa.userId === userId
      )
      // Editors with full oversight can also edit (they're not per-record restricted)
      if (!isAssignedReviewer && userRole === UserRole.FACULTY) {
        return NextResponse.json(
          { error: "Unauthorized - You are not assigned to review this journal" },
          { status: 403 }
        )
      }

      // Faculty/Editor cannot make journal publicly visible
      if (body.isPublic === true) {
        return NextResponse.json(
          { error: "Unauthorized - Only administrators can make journals public" },
          { status: 403 }
        )
      }
    } else if (!isAdminOrHigher(userRole)) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid user role" },
        { status: 403 }
      )
    }

    // 3. Enforce and automate Status transitions
    const currentJournalStatus = existingJournal.journalStatus
    const currentTeacherStatus = existingJournal.teacherStatus

    const newJournalStatus = body.journalStatus as JournalStatus | undefined
    const newTeacherStatus = body.teacherStatus as TeacherStatus | undefined

    // Validation rules for Journal Status
    if (newJournalStatus && newJournalStatus !== currentJournalStatus) {
      // Only admins (and higher) can change publication status to PUBLISHED
      if (newJournalStatus === JournalStatus.PUBLISHED && !isAdminOrHigher(userRole)) {
        return NextResponse.json(
          { error: "Only administrators can publish journals" },
          { status: 403 }
        )
      }

      // Disallow: PUBLISHED -> SUBMITTED, APPROVED -> SUBMITTED
      if (currentJournalStatus === JournalStatus.PUBLISHED) {
        return NextResponse.json(
          { error: "Cannot modify status of a published journal" },
          { status: 400 }
        )
      }
      if (currentJournalStatus === JournalStatus.APPROVED && newJournalStatus === JournalStatus.SUBMITTED) {
        return NextResponse.json(
          { error: "Invalid status transition from APPROVED to SUBMITTED" },
          { status: 400 }
        )
      }
    }

    // Validation rules for Teacher Status
    if (newTeacherStatus && newTeacherStatus !== currentTeacherStatus) {
      // Disallow: REJECTED -> ACCEPTED
      if (currentTeacherStatus === TeacherStatus.REJECTED && newTeacherStatus === TeacherStatus.ACCEPTED) {
        return NextResponse.json(
          { error: "Cannot transition teacher status from REJECTED to ACCEPTED" },
          { status: 400 }
        )
      }
      
      // Disallow: PUBLISHED -> UPDATE, PUBLISHED -> ACCEPTED
      if (currentTeacherStatus === TeacherStatus.PUBLISHED) {
        if (newTeacherStatus === TeacherStatus.UPDATE || newTeacherStatus === TeacherStatus.ACCEPTED) {
          return NextResponse.json(
            { error: `Cannot transition from PUBLISHED to ${newTeacherStatus}` },
            { status: 400 }
          )
        }
      }

      // Entire journal locked if REJECTED
      if (currentTeacherStatus === TeacherStatus.REJECTED) {
        return NextResponse.json(
          { error: "Journal is rejected and locked" },
          { status: 400 }
        )
      }
    }

    // Automated transitions
    // Student edits own journal under UPDATE -> teacherStatus changes back to UPLOADED, clear updateComment
    if (userRole === UserRole.STUDENT && currentTeacherStatus === TeacherStatus.UPDATE) {
      body.teacherStatus = TeacherStatus.UPLOADED
      body.updateComment = null
    }

    // Accept: teacherStatus = ACCEPTED -> journalStatus becomes UNDER_REVIEW
    if (newTeacherStatus === TeacherStatus.ACCEPTED) {
      body.journalStatus = JournalStatus.UNDER_REVIEW
    }

    // Admin publication approval: journalStatus = PUBLISHED -> isPublic becomes true
    if (newJournalStatus === JournalStatus.PUBLISHED) {
      body.isPublic = true
    }

    // 4. Validate final merged record against Zod Schema
    const mergedData = {
      serialNo: body.serialNo !== undefined ? body.serialNo : existingJournal.serialNo,
      title: body.title !== undefined ? body.title : existingJournal.title,
      journalName: body.journalName !== undefined ? body.journalName : existingJournal.journalName,
      abstract: body.abstract !== undefined ? body.abstract : existingJournal.abstract,
      scope: body.scope !== undefined ? body.scope : existingJournal.scope,
      reviewType: body.reviewType !== undefined ? body.reviewType : existingJournal.reviewType,
      accessType: body.accessType !== undefined ? body.accessType : existingJournal.accessType,
      indexing: body.indexing !== undefined ? body.indexing : existingJournal.indexing,
      quartile: body.quartile !== undefined ? body.quartile : existingJournal.quartile,
      publicationMode: body.publicationMode !== undefined ? body.publicationMode : existingJournal.publicationMode,
      publisher: body.publisher !== undefined ? body.publisher : existingJournal.publisher,
      keywords: body.keywords !== undefined ? body.keywords : existingJournal.keywords,
      documentUrl: body.documentUrl !== undefined ? body.documentUrl : existingJournal.documentUrl,
      imageUrl: body.imageUrl !== undefined ? body.imageUrl : existingJournal.imageUrl,
      paperLink: body.paperLink !== undefined ? body.paperLink : existingJournal.paperLink,
      doi: body.doi !== undefined ? body.doi : existingJournal.doi,
      publicationDate: body.publicationDate !== undefined ? body.publicationDate : existingJournal.publicationDate,
      impactFactor: body.impactFactor !== undefined ? (body.impactFactor ? parseFloat(body.impactFactor) : null) : existingJournal.impactFactor,
      impactFactorDate: body.impactFactorDate !== undefined ? (body.impactFactorDate ? new Date(body.impactFactorDate) : null) : existingJournal.impactFactorDate,
      registrationFees: body.registrationFees !== undefined ? (body.registrationFees ? parseFloat(body.registrationFees) : null) : existingJournal.registrationFees,
      reimbursement: body.reimbursement !== undefined ? (body.reimbursement ? parseFloat(body.reimbursement) : null) : existingJournal.reimbursement,
      journalStatus: body.journalStatus !== undefined ? body.journalStatus : existingJournal.journalStatus,
      teacherStatus: body.teacherStatus !== undefined ? body.teacherStatus : existingJournal.teacherStatus,
      isPublic: body.isPublic !== undefined ? body.isPublic : existingJournal.isPublic,
      studentAuthorIds: body.studentAuthorIds !== undefined ? body.studentAuthorIds : existingJournal.studentAuthors.map((sa) => sa.userId),
      facultyAuthorIds: body.facultyAuthorIds !== undefined ? body.facultyAuthorIds : existingJournal.facultyAuthors.map((fa) => fa.userId).filter(Boolean),
      // external authors are only accepted on create; on edit we pass empty arrays so schema validates
      externalFacultyAuthors: [],
      externalStudentAuthors: [],
    }

    const validationResult = journalSchema.safeParse(mergedData)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message, details: validationResult.error.issues },
        { status: 400 }
      )
    }

    // 5. Check duplicate serial number (if modified)
    if (body.serialNo && body.serialNo !== existingJournal.serialNo) {
      const duplicateSerialNo = await prisma.journal.findUnique({
        where: { serialNo: body.serialNo },
      })
      if (duplicateSerialNo) {
        return NextResponse.json(
          { error: "A journal with this serial number already exists" },
          { status: 400 }
        )
      }
    }

    // 6. If updating author lists, check database validity
    if (body.studentAuthorIds) {
      const validStudents = await prisma.user.findMany({
        where: {
          id: { in: body.studentAuthorIds },
          role: UserRole.STUDENT,
        },
      })
      if (validStudents.length !== body.studentAuthorIds.length) {
        return NextResponse.json(
          { error: "One or more student authors are invalid" },
          { status: 400 }
        )
      }

      // If student editing, make sure they don't remove themselves
      if (userRole === UserRole.STUDENT && !body.studentAuthorIds.includes(userId)) {
        return NextResponse.json(
          { error: "You must remain listed as an author on your own publication" },
          { status: 400 }
        )
      }
    }

    if (body.facultyAuthorIds) {
      const validFaculty = await prisma.user.findMany({
        where: {
          id: { in: body.facultyAuthorIds },
          role: UserRole.FACULTY,
        },
      })
      if (validFaculty.length !== body.facultyAuthorIds.length) {
        return NextResponse.json(
          { error: "One or more faculty authors are invalid" },
          { status: 400 }
        )
      }
    }

    // 7. Perform update
    const updateData: any = {}
    
    // Direct fields
    const directFields = [
      "serialNo",
      "title",
      "journalName",
      "abstract",
      "scope",
      "reviewType",
      "accessType",
      "indexing",
      "quartile",
      "publicationMode",
      "publisher",
      "keywords",
      "imageUrl",
      "documentUrl",
      "doi",
      "paperLink",
      "isPublic",
      "journalStatus",
      "teacherStatus",
      "updateComment",
    ]

    for (const field of directFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Parse specific float/date properties
    if (body.impactFactor !== undefined) {
      updateData.impactFactor = body.impactFactor ? parseFloat(body.impactFactor) : null
    }
    if (body.impactFactorDate !== undefined) {
      updateData.impactFactorDate = body.impactFactorDate ? new Date(body.impactFactorDate) : null
    }
    if (body.publicationDate !== undefined) {
      updateData.publicationDate = body.publicationDate ? new Date(body.publicationDate) : null
    }
    if (body.registrationFees !== undefined) {
      updateData.registrationFees = body.registrationFees ? parseFloat(body.registrationFees) : null
    }
    if (body.reimbursement !== undefined) {
      updateData.reimbursement = body.reimbursement ? parseFloat(body.reimbursement) : null
    }

    // Set authors
    if (body.studentAuthorIds !== undefined) {
      await prisma.journalStudentAuthor.deleteMany({
        where: { journalId: id },
      })
      updateData.studentAuthors = {
        create: body.studentAuthorIds.map((uId: string) => ({
          userId: uId,
        })),
      }
    }

    if (body.facultyAuthorIds !== undefined) {
      await prisma.journalTeacherAuthor.deleteMany({
        where: { journalId: id },
      })
      updateData.facultyAuthors = {
        create: body.facultyAuthorIds.map((uId: string) => ({
          userId: uId,
        })),
      }
    }

    const journal = await prisma.journal.update({
      where: { id },
      data: updateData,
      include: {
        studentAuthors: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        facultyAuthors: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    // Create notifications based on status transitions
    const studentUserIds = journal.studentAuthors.map((sa) => sa.userId)
    const facultyUserIds = journal.facultyAuthors.map((fa) => fa.userId).filter((id): id is string => id !== null)

    const notifyUser = async (uId: string, title: string, message: string, type: string) => {
      try {
        await prisma.notification.create({
          data: {
            userId: uId,
            title,
            message,
            type,
            link: `/dashboard/journal?id=${id}`,
          },
        })
      } catch (err) {
        console.error("Failed to create notification for user", uId, err)
      }
    }

    // Trigger Notifications
    if (newTeacherStatus && newTeacherStatus !== currentTeacherStatus) {
      if (newTeacherStatus === TeacherStatus.ACCEPTED) {
        // Notify student authors
        for (const sa of journal.studentAuthors) {
          await notifyUser(
            sa.userId,
            "Journal Approved by Faculty",
            `Your publication '${journal.title}' has been accepted by the faculty reviewer.`,
            "JOURNAL_APPROVED"
          )
          if (sa.user.email) {
            await sendNotificationEmail({
              to: sa.user.email,
              recipientName: sa.user.name || "Student",
              type: "APPROVED",
              resourceType: "journal",
              resourceTitle: journal.title,
              dashboardLink: `/dashboard/journal?id=${id}`,
            }).catch(err => console.error("[Email] Failed to send email", err))
          }
        }
        // Notify all admins
        const admins = await prisma.user.findMany({
          where: { role: UserRole.ADMIN },
          select: { id: true, email: true, name: true },
        })
        for (const admin of admins) {
          await notifyUser(
            admin.id,
            "Journal Ready for Publication",
            `The publication '${journal.title}' has been approved by the reviewer and is ready for final publication.`,
            "JOURNAL_APPROVED"
          )
          if (admin.email) {
            await sendNotificationEmail({
              to: admin.email,
              recipientName: admin.name || "Admin",
              type: "APPROVED",
              resourceType: "journal",
              resourceTitle: journal.title,
              dashboardLink: `/dashboard/journal?id=${id}`,
              isAdminNotification: true,
            }).catch(err => console.error("[Email] Failed to send email", err))
          }
        }
      } else if (newTeacherStatus === TeacherStatus.UPDATE) {
        // Notify student authors
        for (const sa of journal.studentAuthors) {
          await notifyUser(
            sa.userId,
            "Revision Requested for Journal",
            `The reviewer requested changes for '${journal.title}'. Reason: ${body.updateComment || "Please view details."}`,
            "JOURNAL_UPDATE_REQUESTED"
          )
          if (sa.user.email) {
            await sendNotificationEmail({
              to: sa.user.email,
              recipientName: sa.user.name || "Student",
              type: "REVISION",
              resourceType: "journal",
              resourceTitle: journal.title,
              dashboardLink: `/dashboard/journal?id=${id}`,
              message: body.updateComment || "Please view details.",
            }).catch(err => console.error("[Email] Failed to send email", err))
          }
        }
      } else if (newTeacherStatus === TeacherStatus.REJECTED) {
        // Notify student authors
        for (const sa of journal.studentAuthors) {
          await notifyUser(
            sa.userId,
            "Journal Rejected",
            `Your publication '${journal.title}' was rejected by the reviewer.`,
            "JOURNAL_REJECTED"
          )
          if (sa.user.email) {
            await sendNotificationEmail({
              to: sa.user.email,
              recipientName: sa.user.name || "Student",
              type: "REJECTED",
              resourceType: "journal",
              resourceTitle: journal.title,
              dashboardLink: `/dashboard/journal?id=${id}`,
            }).catch(err => console.error("[Email] Failed to send email", err))
          }
        }
      } else if (newTeacherStatus === TeacherStatus.UPLOADED) {
        // Notify faculty co-authors
        for (const fa of journal.facultyAuthors) {
          await notifyUser(
            fa.userId ?? "",
            "Journal Resubmitted for Review",
            `A co-authored publication '${journal.title}' has been resubmitted for review.`,
            "JOURNAL_SUBMITTED"
          )
          if (fa.user?.email) {
            await sendNotificationEmail({
              to: fa.user.email,
              recipientName: fa.user.name || "Faculty",
              type: "SUBMITTED",
              resourceType: "journal",
              resourceTitle: journal.title,
              dashboardLink: `/dashboard/journal?id=${id}`,
              submittedBy: session.user.name || "A team member",
            }).catch(err => console.error("[Email] Failed to send email", err))
          }
        }
      }
    }

    if (newJournalStatus && newJournalStatus !== currentJournalStatus) {
      if (newJournalStatus === JournalStatus.PUBLISHED) {
        // Notify student authors
        for (const sa of journal.studentAuthors) {
          await notifyUser(
            sa.userId,
            "Journal Published!",
            `Your publication '${journal.title}' has been successfully verified and published by the administrator.`,
            "JOURNAL_PUBLISHED"
          )
          if (sa.user.email) {
            await sendNotificationEmail({
              to: sa.user.email,
              recipientName: sa.user.name || "Student",
              type: "PUBLISHED",
              resourceType: "journal",
              resourceTitle: journal.title,
              dashboardLink: `/dashboard/journal?id=${id}`,
              publicLink: `/publications/journals?id=${id}`,
            }).catch(err => console.error("[Email] Failed to send email", err))
          }
        }
        // Notify faculty co-authors
        for (const fa of journal.facultyAuthors) {
          await notifyUser(
            fa.userId ?? '',
            "Journal Published!",
            `The co-authored publication '${journal.title}' has been successfully published.`,
            "JOURNAL_PUBLISHED"
          )
          if (fa.user?.email) {
            await sendNotificationEmail({
              to: fa.user.email,
              recipientName: fa.user.name || "Faculty",
              type: "PUBLISHED",
              resourceType: "journal",
              resourceTitle: journal.title,
              dashboardLink: `/dashboard/journal?id=${id}`,
              publicLink: `/publications/journals?id=${id}`,
            }).catch(err => console.error("[Email] Failed to send email", err))
          }
        }

        // Broadcast to all users
        if (body.isPublic || existingJournal.isPublic) {
          const allAuthorNames = [
            ...journal.studentAuthors.map(sa => sa.user.name).filter((n): n is string => !!n),
            ...journal.facultyAuthors.map(fa => fa.user?.name).filter((n): n is string => !!n),
          ]
          const allAuthorIds = [...studentUserIds, ...facultyUserIds]

          broadcastPublicationEmail({
            resourceType: "journal",
            resourceTitle: journal.title,
            resourceId: id,
            authors: allAuthorNames,
            excludeUserIds: allAuthorIds,
          }).catch(err => console.error("[Email] Broadcast failed:", err))
        }
      }
    }

    return NextResponse.json({ journal })
  } catch (error) {
    console.error("Error updating journal:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete single journal with permission verification
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    const journal = await prisma.journal.findUnique({
      where: { id },
      include: { facultyAuthors: true },
    })

    if (!journal) {
      return NextResponse.json(
        { error: "Journal not found" },
        { status: 404 }
      )
    }

    const userRole = session.user.role
    const userId = session.user.id

    // Secure verification: Only admins can delete anything, faculty can delete journals they review/author, students cannot delete
    if (userRole === UserRole.STUDENT) {
      return NextResponse.json(
        { error: "Unauthorized - Students cannot delete journals" },
        { status: 403 }
      )
    }

    if (userRole === UserRole.FACULTY) {
      const isAssigned = journal.facultyAuthors.some((fa) => fa.userId === userId)
      if (!isAssigned) {
        return NextResponse.json(
          { error: "Unauthorized - You can only delete journals you are assigned to" },
          { status: 403 }
        )
      }
    }

    await prisma.journal.delete({
      where: { id },
    })

    return NextResponse.json({
      message: "Journal deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting journal:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
