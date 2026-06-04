import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { UserRole, TeacherStatus, CopyrightStatus } from '@prisma/client'
import { copyrightSchema } from '@/lib/validations/copyright'
import { sendNotificationEmail, broadcastPublicationEmail } from '@/lib/mail'

// GET - Get single copyright by ID
export async function GET(
  req: NextRequest,
 { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const { id } = await  params

    const copyright = await prisma.copyright.findUnique({
      where: { id },
      include: {
        studentAuthors: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
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
                image: true
              }
            }
          }
        }
      }
    })

    if (!copyright) {
      return NextResponse.json(
        { error: 'Copyright not found' },
        { status: 404 }
      )
    }

   if (!copyright.isPublic) {
         // Private chapter - check authorization
         if (!session) {
           return NextResponse.json(
             { error: 'Unauthorized - Please sign in to view this book chapter' },
             { status: 401 }
           )
         }
   
         // Allow admins
         const isAdmin = session.user.role === UserRole.ADMIN
   
         // Check if user is one of the authors
         const isStudentAuthor = copyright.studentAuthors.some(
           author => author.user.email === session.user.email
         )
         const isFacultyAuthor = copyright.facultyAuthors.some(
           author => author.user.email === session.user.email
         )
   
         if (!isAdmin && !isStudentAuthor && !isFacultyAuthor) {
           return NextResponse.json(
             { error: 'Unauthorized to view this book chapter' },
             { status: 403 }
           )
         }
       }
    return NextResponse.json({ copyright })
  } catch (error) {
    console.error('Error fetching copyright:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update copyright with role validation, status transition validation and Zod schema
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

    // 1. Fetch current copyright status & author mapping
    const existingCopyright = await prisma.copyright.findUnique({
      where: { id },
      include: {
        studentAuthors: true,
        facultyAuthors: true,
      },
    })

    if (!existingCopyright) {
      return NextResponse.json(
        { error: "Copyright not found" },
        { status: 404 }
      )
    }

    const userRole = session.user.role
    const userId = session.user.id

    // 2. Validate user role permissions to modify this specific copyright
    if (userRole === UserRole.STUDENT) {
      const isAuthor = existingCopyright.studentAuthors.some(
        (sa) => sa.userId === userId
      )
      if (!isAuthor) {
        return NextResponse.json(
          { error: "Unauthorized - You can only edit your own copyrights" },
          { status: 403 }
        )
      }

      // Students can only edit before publication and when requested update or newly uploaded
      const isLocked =
        existingCopyright.copyrightStatus === CopyrightStatus.PUBLISHED ||
        existingCopyright.teacherStatus === TeacherStatus.ACCEPTED ||
        existingCopyright.teacherStatus === TeacherStatus.REJECTED ||
        existingCopyright.teacherStatus === TeacherStatus.PUBLISHED

      if (isLocked) {
        return NextResponse.json(
          { error: "This copyright is locked and cannot be edited by students" },
          { status: 403 }
        )
      }

      // Prevent student from updating system fields
      delete body.copyrightStatus
      delete body.teacherStatus
      delete body.isPublic
    } else if (userRole === UserRole.FACULTY) {
      const isAssignedReviewer = existingCopyright.facultyAuthors.some(
        (fa) => fa.userId === userId
      )
      if (!isAssignedReviewer) {
        return NextResponse.json(
          { error: "Unauthorized - You are not assigned to review this copyright" },
          { status: 403 }
        )
      }

      // Faculty cannot make copyright publicly visible
      if (body.isPublic === true) {
        return NextResponse.json(
          { error: "Unauthorized - Faculty cannot make copyrights public" },
          { status: 403 }
        )
      }
    } else if (userRole !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid user role" },
        { status: 403 }
      )
    }

    // 3. Enforce and automate Status transitions
    const currentCopyrightStatus = existingCopyright.copyrightStatus
    const currentTeacherStatus = existingCopyright.teacherStatus

    const newCopyrightStatus = body.copyrightStatus as CopyrightStatus | undefined
    const newTeacherStatus = body.teacherStatus as TeacherStatus | undefined

    // Validation rules for Copyright Status
    if (newCopyrightStatus && newCopyrightStatus !== currentCopyrightStatus) {
      // Only admins can change status to PUBLISHED
      if (newCopyrightStatus === CopyrightStatus.PUBLISHED && userRole !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: "Only administrators can publish copyrights" },
          { status: 403 }
        )
      }

      // Disallow transitions out of PUBLISHED
      if (currentCopyrightStatus === CopyrightStatus.PUBLISHED) {
        return NextResponse.json(
          { error: "Cannot modify status of a published copyright" },
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

      // Disallow: PUBLISHED -> ACCEPTED/UPDATE
      if (currentTeacherStatus === TeacherStatus.PUBLISHED) {
        if (newTeacherStatus === TeacherStatus.UPDATE || newTeacherStatus === TeacherStatus.ACCEPTED) {
          return NextResponse.json(
            { error: `Cannot transition from PUBLISHED to ${newTeacherStatus}` },
            { status: 400 }
          )
        }
      }

      // Entire copyright locked if REJECTED
      if (currentTeacherStatus === TeacherStatus.REJECTED) {
        return NextResponse.json(
          { error: "Copyright is rejected and locked" },
          { status: 400 }
        )
      }
    }

    // Automated transitions
    // Student edits own copyright under UPDATE -> teacherStatus changes back to UPLOADED, clear updateComment
    if (userRole === UserRole.STUDENT && currentTeacherStatus === TeacherStatus.UPDATE) {
      body.teacherStatus = TeacherStatus.UPLOADED
      body.updateComment = null
    }

    // Accept: teacherStatus = ACCEPTED -> copyrightStatus becomes UNDER_REVIEW
    if (newTeacherStatus === TeacherStatus.ACCEPTED) {
      body.copyrightStatus = CopyrightStatus.UNDER_REVIEW
    }

    // Admin publication approval: copyrightStatus = PUBLISHED -> isPublic becomes true, teacherStatus = PUBLISHED
    if (newCopyrightStatus === CopyrightStatus.PUBLISHED) {
      body.isPublic = true
      body.teacherStatus = TeacherStatus.PUBLISHED
    }

    // 4. Validate final merged record against Zod Schema
    const mergedData = {
      regNo: body.regNo !== undefined ? body.regNo : existingCopyright.regNo,
      title: body.title !== undefined ? body.title : existingCopyright.title,
      abstract: body.abstract !== undefined ? body.abstract : existingCopyright.abstract,
      imageUrl: body.imageUrl !== undefined ? body.imageUrl : existingCopyright.imageUrl,
      documentUrl: body.documentUrl !== undefined ? body.documentUrl : existingCopyright.documentUrl,
      dateOfFiling: body.dateOfFiling !== undefined ? body.dateOfFiling : existingCopyright.dateOfFiling,
      dateOfSubmission: body.dateOfSubmission !== undefined ? body.dateOfSubmission : existingCopyright.dateOfSubmission,
      dateOfPublished: body.dateOfPublished !== undefined ? body.dateOfPublished : existingCopyright.dateOfPublished,
      dateOfGrant: body.dateOfGrant !== undefined ? body.dateOfGrant : existingCopyright.dateOfGrant,
      registrationFees: body.registrationFees !== undefined ? (body.registrationFees ? parseFloat(body.registrationFees) : null) : existingCopyright.registrationFees,
      reimbursement: body.reimbursement !== undefined ? (body.reimbursement ? parseFloat(body.reimbursement) : null) : existingCopyright.reimbursement,
      copyrightStatus: body.copyrightStatus !== undefined ? body.copyrightStatus : existingCopyright.copyrightStatus,
      teacherStatus: body.teacherStatus !== undefined ? body.teacherStatus : existingCopyright.teacherStatus,
      isPublic: body.isPublic !== undefined ? body.isPublic : existingCopyright.isPublic,
      studentAuthorIds: body.studentAuthorIds !== undefined ? body.studentAuthorIds : existingCopyright.studentAuthors.map((sa) => sa.userId),
      facultyAuthorIds: body.facultyAuthorIds !== undefined ? body.facultyAuthorIds : existingCopyright.facultyAuthors.map((fa) => fa.userId),
      updateComment: body.updateComment !== undefined ? body.updateComment : existingCopyright.updateComment,
    }

    const validationResult = copyrightSchema.safeParse(mergedData)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message, details: validationResult.error.issues },
        { status: 400 }
      )
    }

    // 5. If updating author lists, check database validity
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

    // 6. Perform update
    const updateData: any = {}
    const directFields = [
      "regNo",
      "title",
      "abstract",
      "imageUrl",
      "documentUrl",
      "copyrightStatus",
      "teacherStatus",
      "isPublic",
      "updateComment",
    ]

    for (const field of directFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (body.dateOfFiling !== undefined) {
      updateData.dateOfFiling = body.dateOfFiling ? new Date(body.dateOfFiling) : null
    }
    if (body.dateOfSubmission !== undefined) {
      updateData.dateOfSubmission = body.dateOfSubmission ? new Date(body.dateOfSubmission) : null
    }
    if (body.dateOfPublished !== undefined) {
      updateData.dateOfPublished = body.dateOfPublished ? new Date(body.dateOfPublished) : null
    }
    if (body.dateOfGrant !== undefined) {
      updateData.dateOfGrant = body.dateOfGrant ? new Date(body.dateOfGrant) : null
    }
    if (body.registrationFees !== undefined) {
      updateData.registrationFees = body.registrationFees ? parseFloat(body.registrationFees) : null
    }
    if (body.reimbursement !== undefined) {
      updateData.reimbursement = body.reimbursement ? parseFloat(body.reimbursement) : null
    }

    // Set authors
    if (body.studentAuthorIds !== undefined) {
      await prisma.copyrightStudentAuthor.deleteMany({
        where: { copyrightId: id },
      })
      updateData.studentAuthors = {
        create: body.studentAuthorIds.map((uId: string) => ({
          userId: uId,
        })),
      }
    }

    if (body.facultyAuthorIds !== undefined) {
      await prisma.copyrightTeacherAuthor.deleteMany({
        where: { copyrightId: id },
      })
      updateData.facultyAuthors = {
        create: body.facultyAuthorIds.map((uId: string) => ({
          userId: uId,
        })),
      }
    }

    const copyright = await prisma.copyright.update({
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
    const studentUserIds = copyright.studentAuthors.map((sa) => sa.userId)
    const facultyUserIds = copyright.facultyAuthors.map((fa) => fa.userId)

    const notifyUser = async (uId: string, title: string, message: string, type: string) => {
      try {
        await prisma.notification.create({
          data: {
            userId: uId,
            title,
            message,
            type,
            link: `/dashboard/copyright?id=${id}`,
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
        for (const sa of copyright.studentAuthors) {
          await notifyUser(
            sa.userId,
            "Copyright Approved by Faculty",
            `Your copyright '${copyright.title}' has been accepted by the faculty reviewer.`,
            "COPYRIGHT_APPROVED"
          )
          if (sa.user.email) {
            await sendNotificationEmail({
              to: sa.user.email,
              recipientName: sa.user.name || "Student",
              type: "APPROVED",
              resourceType: "copyright",
              resourceTitle: copyright.title,
              dashboardLink: `/dashboard/copyright?id=${id}`,
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
            "Copyright Ready for Publication",
            `The copyright '${copyright.title}' has been approved by the reviewer and is ready for final publication.`,
            "COPYRIGHT_APPROVED"
          )
          if (admin.email) {
            await sendNotificationEmail({
              to: admin.email,
              recipientName: admin.name || "Admin",
              type: "APPROVED",
              resourceType: "copyright",
              resourceTitle: copyright.title,
              dashboardLink: `/dashboard/copyright?id=${id}`,
              isAdminNotification: true,
            }).catch(err => console.error("[Email] Failed to send email", err))
          }
        }
      } else if (newTeacherStatus === TeacherStatus.UPDATE) {
        // Notify student authors
        for (const sa of copyright.studentAuthors) {
          await notifyUser(
            sa.userId,
            "Revision Requested for Copyright",
            `The reviewer requested changes for '${copyright.title}'. Reason: ${body.updateComment || "Please view details."}`,
            "COPYRIGHT_UPDATE_REQUESTED"
          )
          if (sa.user.email) {
            await sendNotificationEmail({
              to: sa.user.email,
              recipientName: sa.user.name || "Student",
              type: "REVISION",
              resourceType: "copyright",
              resourceTitle: copyright.title,
              dashboardLink: `/dashboard/copyright?id=${id}`,
              message: body.updateComment || "Please view details.",
            }).catch(err => console.error("[Email] Failed to send email", err))
          }
        }
      } else if (newTeacherStatus === TeacherStatus.REJECTED) {
        // Notify student authors
        for (const sa of copyright.studentAuthors) {
          await notifyUser(
            sa.userId,
            "Copyright Rejected",
            `Your copyright '${copyright.title}' was rejected by the reviewer.`,
            "COPYRIGHT_REJECTED"
          )
          if (sa.user.email) {
            await sendNotificationEmail({
              to: sa.user.email,
              recipientName: sa.user.name || "Student",
              type: "REJECTED",
              resourceType: "copyright",
              resourceTitle: copyright.title,
              dashboardLink: `/dashboard/copyright?id=${id}`,
            }).catch(err => console.error("[Email] Failed to send email", err))
          }
        }
      } else if (newTeacherStatus === TeacherStatus.UPLOADED) {
        // Notify faculty co-authors
        for (const fa of copyright.facultyAuthors) {
          await notifyUser(
            fa.userId,
            "Copyright Resubmitted for Review",
            `A co-authored copyright '${copyright.title}' has been resubmitted for review.`,
            "COPYRIGHT_SUBMITTED"
          )
          if (fa.user.email) {
            await sendNotificationEmail({
              to: fa.user.email,
              recipientName: fa.user.name || "Faculty",
              type: "SUBMITTED",
              resourceType: "copyright",
              resourceTitle: copyright.title,
              dashboardLink: `/dashboard/copyright?id=${id}`,
              submittedBy: session.user.name || "A team member",
            }).catch(err => console.error("[Email] Failed to send email", err))
          }
        }
      }
    }

    if (newCopyrightStatus && newCopyrightStatus !== currentCopyrightStatus) {
      if (newCopyrightStatus === CopyrightStatus.PUBLISHED) {
        // Notify student authors
        for (const sa of copyright.studentAuthors) {
          await notifyUser(
            sa.userId,
            "Copyright Published!",
            `Your copyright '${copyright.title}' has been successfully verified and published by the administrator.`,
            "COPYRIGHT_PUBLISHED"
          )
          if (sa.user.email) {
            await sendNotificationEmail({
              to: sa.user.email,
              recipientName: sa.user.name || "Student",
              type: "PUBLISHED",
              resourceType: "copyright",
              resourceTitle: copyright.title,
              dashboardLink: `/dashboard/copyright?id=${id}`,
              publicLink: `/publications/copyrights?id=${id}`,
            }).catch(err => console.error("[Email] Failed to send email", err))
          }
        }
        // Notify faculty co-authors
        for (const fa of copyright.facultyAuthors) {
          await notifyUser(
            fa.userId,
            "Copyright Published!",
            `The co-authored copyright '${copyright.title}' has been successfully published.`,
            "COPYRIGHT_PUBLISHED"
          )
          if (fa.user.email) {
            await sendNotificationEmail({
              to: fa.user.email,
              recipientName: fa.user.name || "Faculty",
              type: "PUBLISHED",
              resourceType: "copyright",
              resourceTitle: copyright.title,
              dashboardLink: `/dashboard/copyright?id=${id}`,
              publicLink: `/publications/copyrights?id=${id}`,
            }).catch(err => console.error("[Email] Failed to send email", err))
          }
        }
        
        // Broadcast to all users
        if (body.isPublic || existingCopyright.isPublic) {
          const allAuthorNames = [
            ...copyright.studentAuthors.map(sa => sa.user.name).filter(Boolean),
            ...copyright.facultyAuthors.map(fa => fa.user.name).filter(Boolean),
          ] as string[]
          const allAuthorIds = [...studentUserIds, ...facultyUserIds]

          broadcastPublicationEmail({
            resourceType: "copyright",
            resourceTitle: copyright.title,
            resourceId: id,
            authors: allAuthorNames,
            excludeUserIds: allAuthorIds,
          }).catch(err => console.error("[Email] Broadcast failed:", err))
        }
      }
    }

    return NextResponse.json({ copyright })
  } catch (error) {
    console.error("Error updating copyright:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete single copyright with permissions
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

    const copyright = await prisma.copyright.findUnique({
      where: { id },
      include: { facultyAuthors: true },
    })

    if (!copyright) {
      return NextResponse.json(
        { error: "Copyright not found" },
        { status: 404 }
      )
    }

    const userRole = session.user.role
    const userId = session.user.id

    // Student role is completely forbidden from deleting
    if (userRole === UserRole.STUDENT) {
      return NextResponse.json(
        { error: "Unauthorized - Students cannot delete copyrights" },
        { status: 403 }
      )
    }

    // Faculty role can only delete copyrights they are assigned/authors on
    if (userRole === UserRole.FACULTY) {
      const isAssigned = copyright.facultyAuthors.some((fa) => fa.userId === userId)
      if (!isAssigned) {
        return NextResponse.json(
          { error: "Unauthorized - You can only delete copyrights you are assigned to" },
          { status: 403 }
        )
      }
    }

    await prisma.copyright.delete({
      where: { id },
    })

    return NextResponse.json({
      message: "Copyright deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting copyright:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
