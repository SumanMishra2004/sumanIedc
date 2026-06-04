import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { UserRole, TeacherStatus, ConferenceStatus, ConferenceMode } from '@prisma/client'
import { conferenceSchema } from '@/lib/validations/conference'
import { sendNotificationEmail, broadcastPublicationEmail } from '@/lib/mail'

// GET - Get single conference by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    const conference = await prisma.conference.findUnique({
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
                department: true,
              }
            }
          }
        }
      }
    })

    if (!conference) {
      return NextResponse.json(
        { error: 'Conference not found' },
        { status: 404 }
      )
    }

    // Access control - check if user can view
    if (!conference.isPublic) {
      // Private conference - check authorization
      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized - Please sign in to view this conference' },
          { status: 401 }
        )
      }

      // Allow admins
      const isAdmin = session.user.role === UserRole.ADMIN

      // Check if user is one of the authors
      const isStudentAuthor = conference.studentAuthors.some(
        author => author.user.email === session.user.email
      )
      const isFacultyAuthor = conference.facultyAuthors.some(
        author => author.user.email === session.user.email
      )

      if (!isAdmin && !isStudentAuthor && !isFacultyAuthor) {
        return NextResponse.json(
          { error: 'Unauthorized to view this conference' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ conference })
  } catch (error) {
    console.error('Error fetching conference:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update conference with validation, transitions and notifications
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // 1. Fetch existing record
    const existingConference = await prisma.conference.findUnique({
      where: { id },
      include: {
        studentAuthors: true,
        facultyAuthors: true,
      }
    })

    if (!existingConference) {
      return NextResponse.json(
        { error: 'Conference not found' },
        { status: 404 }
      )
    }

    const userRole = session.user.role
    const userId = session.user.id

    // 2. Validate role-based permissions
    if (userRole === UserRole.STUDENT) {
      const isAuthor = existingConference.studentAuthors.some(
        (sa) => sa.userId === userId
      )
      if (!isAuthor) {
        return NextResponse.json(
          { error: "Unauthorized - You can only edit your own conferences" },
          { status: 403 }
        )
      }

      // Lock checking
      const isLocked =
        existingConference.conferenceStatus === ConferenceStatus.PUBLISHED ||
        existingConference.teacherStatus === TeacherStatus.ACCEPTED ||
        existingConference.teacherStatus === TeacherStatus.REJECTED ||
        existingConference.teacherStatus === TeacherStatus.PUBLISHED

      if (isLocked) {
        return NextResponse.json(
          { error: "This conference is locked and cannot be edited by students" },
          { status: 403 }
        )
      }

      // Prevent student modifying status or visibility directly
      delete body.conferenceStatus
      delete body.teacherStatus
      delete body.isPublic
    } else if (userRole === UserRole.FACULTY) {
      const isAssigned = existingConference.facultyAuthors.some(
        (fa) => fa.userId === userId
      )
      if (!isAssigned) {
        return NextResponse.json(
          { error: "Unauthorized - You are not assigned to review this conference" },
          { status: 403 }
        )
      }

      if (body.isPublic === true) {
        return NextResponse.json(
          { error: "Unauthorized - Faculty cannot make conferences public" },
          { status: 403 }
        )
      }
    } else if (userRole !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid user role" },
        { status: 403 }
      )
    }

    // 3. Enforce status transition validation
    const currentConfStatus = existingConference.conferenceStatus
    const currentTeacherStatus = existingConference.teacherStatus

    const newConfStatus = body.conferenceStatus as ConferenceStatus | undefined
    const newTeacherStatus = body.teacherStatus as TeacherStatus | undefined

    if (newConfStatus && newConfStatus !== currentConfStatus) {
      if (newConfStatus === ConferenceStatus.PUBLISHED && userRole !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: "Only administrators can publish conferences" },
          { status: 403 }
        )
      }
      if (currentConfStatus === ConferenceStatus.PUBLISHED) {
        return NextResponse.json(
          { error: "Cannot modify status of a published conference" },
          { status: 400 }
        )
      }
    }

    if (newTeacherStatus && newTeacherStatus !== currentTeacherStatus) {
      if (currentTeacherStatus === TeacherStatus.REJECTED && newTeacherStatus === TeacherStatus.ACCEPTED) {
        return NextResponse.json(
          { error: "Cannot transition status from REJECTED to ACCEPTED" },
          { status: 400 }
        )
      }
      if (currentTeacherStatus === TeacherStatus.PUBLISHED) {
        if (newTeacherStatus === TeacherStatus.UPDATE || newTeacherStatus === TeacherStatus.ACCEPTED) {
          return NextResponse.json(
            { error: `Cannot transition from PUBLISHED to ${newTeacherStatus}` },
            { status: 400 }
          )
        }
      }
      if (currentTeacherStatus === TeacherStatus.REJECTED) {
        return NextResponse.json(
          { error: "This conference is rejected and locked" },
          { status: 400 }
        )
      }
    }

    // Automated transitions
    if (userRole === UserRole.STUDENT && currentTeacherStatus === TeacherStatus.UPDATE) {
      body.teacherStatus = TeacherStatus.UPLOADED
      body.updateComment = null
    }

    if (newTeacherStatus === TeacherStatus.ACCEPTED) {
      body.conferenceStatus = ConferenceStatus.UNDER_REVIEW
    }

    if (newConfStatus === ConferenceStatus.PUBLISHED) {
      body.isPublic = true
      body.teacherStatus = TeacherStatus.PUBLISHED
    }

    // 4. Validate merged data using schema
    const mergedData = {
      conferenceName: body.conferenceName !== undefined ? body.conferenceName : existingConference.conferenceName,
      paperName: body.paperName !== undefined ? body.paperName : existingConference.paperName,
      abstract: body.abstract !== undefined ? body.abstract : existingConference.abstract,
      imageUrl: body.imageUrl !== undefined ? body.imageUrl : existingConference.imageUrl,
      documentUrl: body.documentUrl !== undefined ? body.documentUrl : existingConference.documentUrl,
      conferenceStatus: body.conferenceStatus !== undefined ? body.conferenceStatus : existingConference.conferenceStatus,
      teacherStatus: body.teacherStatus !== undefined ? body.teacherStatus : existingConference.teacherStatus,
      mode: body.mode !== undefined ? body.mode : existingConference.mode,
      registrationFees: body.registrationFees !== undefined ? (body.registrationFees ? parseFloat(body.registrationFees) : null) : existingConference.registrationFees,
      reimbursement: body.reimbursement !== undefined ? (body.reimbursement ? parseFloat(body.reimbursement) : null) : existingConference.reimbursement,
      isPublic: body.isPublic !== undefined ? body.isPublic : existingConference.isPublic,
      keywords: body.keywords !== undefined ? body.keywords : existingConference.keywords,
      paperDoi: body.paperDoi !== undefined ? body.paperDoi : existingConference.paperDoi,
      paperLink: body.paperLink !== undefined ? body.paperLink : existingConference.paperLink,
      conferenceDate: body.conferenceDate !== undefined ? body.conferenceDate : existingConference.conferenceDate,
      conferencePublisher: body.conferencePublisher !== undefined ? body.conferencePublisher : existingConference.conferencePublisher,
      studentAuthorIds: body.studentAuthorIds !== undefined ? body.studentAuthorIds : existingConference.studentAuthors.map((sa) => sa.userId),
      facultyAuthorIds: body.facultyAuthorIds !== undefined ? body.facultyAuthorIds : existingConference.facultyAuthors.map((fa) => fa.userId),
      updateComment: body.updateComment !== undefined ? body.updateComment : null,
    }

    const validationResult = conferenceSchema.safeParse(mergedData)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message, details: validationResult.error.issues },
        { status: 400 }
      )
    }

    // Validate Author ID constraints
    if (body.studentAuthorIds) {
      const validStudents = await prisma.user.findMany({
        where: { id: { in: body.studentAuthorIds }, role: UserRole.STUDENT }
      })
      if (validStudents.length !== body.studentAuthorIds.length) {
        return NextResponse.json({ error: "One or more student authors are invalid" }, { status: 400 })
      }
      if (userRole === UserRole.STUDENT && !body.studentAuthorIds.includes(userId)) {
        return NextResponse.json({ error: "You must remain listed as an author on your own publication" }, { status: 400 })
      }
    }

    if (body.facultyAuthorIds) {
      const validFaculty = await prisma.user.findMany({
        where: { id: { in: body.facultyAuthorIds }, role: UserRole.FACULTY }
      })
      if (validFaculty.length !== body.facultyAuthorIds.length) {
        return NextResponse.json({ error: "One or more faculty authors are invalid" }, { status: 400 })
      }
    }

    // 5. Update Database Record
    const updateData: any = {}
    const directFields = [
      "conferenceName",
      "paperName",
      "abstract",
      "imageUrl",
      "documentUrl",
      "conferenceStatus",
      "teacherStatus",
      "mode",
      "isPublic",
      "keywords",
      "paperDoi",
      "paperLink",
      "conferencePublisher",
    ]

    for (const field of directFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (body.conferenceDate !== undefined) {
      updateData.conferenceDate = body.conferenceDate ? new Date(body.conferenceDate) : null
    }
    if (body.registrationFees !== undefined) {
      updateData.registrationFees = body.registrationFees ? parseFloat(body.registrationFees) : null
    }
    if (body.reimbursement !== undefined) {
      updateData.reimbursement = body.reimbursement ? parseFloat(body.reimbursement) : null
    }

    if (body.studentAuthorIds !== undefined) {
      await prisma.conferenceStudentAuthor.deleteMany({ where: { conferenceId: id } })
      updateData.studentAuthors = {
        create: body.studentAuthorIds.map((uId: string) => ({ userId: uId }))
      }
    }

    if (body.facultyAuthorIds !== undefined) {
      await prisma.conferenceTeacherAuthor.deleteMany({ where: { conferenceId: id } })
      updateData.facultyAuthors = {
        create: body.facultyAuthorIds.map((uId: string) => ({ userId: uId }))
      }
    }

    const conference = await prisma.conference.update({
      where: { id },
      data: updateData,
      include: {
        studentAuthors: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        facultyAuthors: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        }
      }
    })

    // 6. Notifications System Dispatch
    const studentUserIds = conference.studentAuthors.map((sa) => sa.userId)
    const facultyUserIds = conference.facultyAuthors.map((fa) => fa.userId)

    const notifyUser = async (uId: string, title: string, message: string, type: string) => {
      try {
        await prisma.notification.create({
          data: {
            userId: uId,
            title,
            message,
            type,
            link: `/dashboard/conferences?id=${id}`,
          }
        })
      } catch (err) {
        console.error("Failed to create notification for user", uId, err)
      }
    }

    if (newTeacherStatus && newTeacherStatus !== currentTeacherStatus) {
      if (newTeacherStatus === TeacherStatus.ACCEPTED) {
        for (const sa of conference.studentAuthors) {
          await notifyUser(
            sa.userId,
            "Conference Approved by Faculty",
            `Your conference '${conference.conferenceName}' has been accepted by the faculty reviewer.`,
            "CONFERENCE_APPROVED"
          )
          if (sa.user.email) {
            await sendNotificationEmail({
              to: sa.user.email,
              recipientName: sa.user.name || "Student",
              type: "APPROVED",
              resourceType: "conference",
              resourceTitle: conference.conferenceName,
              dashboardLink: `/dashboard/conferences?id=${id}`,
            }).catch(err => console.error("[Email] Failed to send email", err))
          }
        }
        // Notify Admins
        const admins = await prisma.user.findMany({
          where: { role: UserRole.ADMIN },
          select: { id: true, email: true, name: true }
        })
        for (const admin of admins) {
          await notifyUser(
            admin.id,
            "Conference Ready for Publication",
            `The conference '${conference.conferenceName}' has been approved by the reviewer and is ready for final publication.`,
            "CONFERENCE_APPROVED"
          )
          if (admin.email) {
            await sendNotificationEmail({
              to: admin.email,
              recipientName: admin.name || "Admin",
              type: "APPROVED",
              resourceType: "conference",
              resourceTitle: conference.conferenceName,
              dashboardLink: `/dashboard/conferences?id=${id}`,
              isAdminNotification: true,
            }).catch(err => console.error("[Email] Failed to send email", err))
          }
        }
      } else if (newTeacherStatus === TeacherStatus.UPDATE) {
        for (const sa of conference.studentAuthors) {
          await notifyUser(
            sa.userId,
            "Revision Requested for Conference",
            `The reviewer requested corrections for '${conference.conferenceName}'. Reason: ${body.updateComment || "Please view details."}`,
            "CONFERENCE_UPDATE_REQUESTED"
          )
          if (sa.user.email) {
            await sendNotificationEmail({
              to: sa.user.email,
              recipientName: sa.user.name || "Student",
              type: "REVISION",
              resourceType: "conference",
              resourceTitle: conference.conferenceName,
              dashboardLink: `/dashboard/conferences?id=${id}`,
              message: body.updateComment || "Please view details.",
            }).catch(err => console.error("[Email] Failed to send email", err))
          }
        }
      } else if (newTeacherStatus === TeacherStatus.REJECTED) {
        for (const sa of conference.studentAuthors) {
          await notifyUser(
            sa.userId,
            "Conference Rejected",
            `Your conference '${conference.conferenceName}' was rejected by the reviewer.`,
            "CONFERENCE_REJECTED"
          )
          if (sa.user.email) {
            await sendNotificationEmail({
              to: sa.user.email,
              recipientName: sa.user.name || "Student",
              type: "REJECTED",
              resourceType: "conference",
              resourceTitle: conference.conferenceName,
              dashboardLink: `/dashboard/conferences?id=${id}`,
            }).catch(err => console.error("[Email] Failed to send email", err))
          }
        }
      } else if (newTeacherStatus === TeacherStatus.UPLOADED) {
        for (const fa of conference.facultyAuthors) {
          await notifyUser(
            fa.userId,
            "Conference Resubmitted for Review",
            `A co-authored conference '${conference.conferenceName}' has been resubmitted for review.`,
            "CONFERENCE_SUBMITTED"
          )
          if (fa.user.email) {
            await sendNotificationEmail({
              to: fa.user.email,
              recipientName: fa.user.name || "Faculty",
              type: "SUBMITTED",
              resourceType: "conference",
              resourceTitle: conference.conferenceName,
              dashboardLink: `/dashboard/conferences?id=${id}`,
              submittedBy: session.user.name || "A team member",
            }).catch(err => console.error("[Email] Failed to send email", err))
          }
        }
      }
    }

    if (newConfStatus && newConfStatus !== currentConfStatus) {
      if (newConfStatus === ConferenceStatus.PUBLISHED) {
        for (const sa of conference.studentAuthors) {
          await notifyUser(
            sa.userId,
            "Conference Published!",
            `Your conference '${conference.conferenceName}' has been successfully verified and published by the administrator.`,
            "CONFERENCE_PUBLISHED"
          )
          if (sa.user.email) {
            await sendNotificationEmail({
              to: sa.user.email,
              recipientName: sa.user.name || "Student",
              type: "PUBLISHED",
              resourceType: "conference",
              resourceTitle: conference.conferenceName,
              dashboardLink: `/dashboard/conferences?id=${id}`,
              publicLink: `/publications/conferences?id=${id}`,
            }).catch(err => console.error("[Email] Failed to send email", err))
          }
        }
        for (const fa of conference.facultyAuthors) {
          await notifyUser(
            fa.userId,
            "Conference Published!",
            `The co-authored conference '${conference.conferenceName}' has been successfully published.`,
            "CONFERENCE_PUBLISHED"
          )
          if (fa.user.email) {
            await sendNotificationEmail({
              to: fa.user.email,
              recipientName: fa.user.name || "Faculty",
              type: "PUBLISHED",
              resourceType: "conference",
              resourceTitle: conference.conferenceName,
              dashboardLink: `/dashboard/conferences?id=${id}`,
              publicLink: `/publications/conferences?id=${id}`,
            }).catch(err => console.error("[Email] Failed to send email", err))
          }
        }
        
        // Broadcast to all users
        if (body.isPublic || existingConference.isPublic) {
          const allAuthorNames = [
            ...conference.studentAuthors.map(sa => sa.user.name).filter(Boolean),
            ...conference.facultyAuthors.map(fa => fa.user.name).filter(Boolean),
          ] as string[]
          const allAuthorIds = [...studentUserIds, ...facultyUserIds]

          broadcastPublicationEmail({
            resourceType: "conference",
            resourceTitle: conference.conferenceName,
            resourceId: id,
            authors: allAuthorNames,
            excludeUserIds: allAuthorIds,
          }).catch(err => console.error("[Email] Broadcast failed:", err))
        }
      }
    }

    return NextResponse.json({ conference })
  } catch (error) {
    console.error('Error updating conference:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete conference
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user || session.user.role === UserRole.STUDENT) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const conference = await prisma.conference.findUnique({
      where: { id },
      include: { facultyAuthors: true }
    })

    if (!conference) {
      return NextResponse.json(
        { error: 'Conference not found' },
        { status: 404 }
      )
    }

    // Faculty author deletion checks
    if (session.user.role === UserRole.FACULTY) {
      const isAssigned = conference.facultyAuthors.some((fa) => fa.userId === session.user.id)
      if (!isAssigned) {
        return NextResponse.json(
          { error: 'Unauthorized - You can only delete conferences you are assigned to' },
          { status: 403 }
        )
      }
    }

    await prisma.conference.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting conference:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
