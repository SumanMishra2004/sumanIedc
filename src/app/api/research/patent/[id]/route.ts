import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { PatentStatus, TeacherStatus, UserRole } from '@prisma/client'
import { patentSchema } from '@/lib/validations/patent'

// GET - Get single patent by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    const patent = await prisma.patent.findUnique({
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

    if (!patent) {
      return NextResponse.json(
        { error: 'Patent not found' },
        { status: 404 }
      )
    }

    // Access control - check if user can view
    if (!patent.isPublic) {
      // Private patent - check authorization
      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized - Please sign in to view this patent' },
          { status: 401 }
        )
      }

      // Allow admins
      const isAdmin = session.user.role === UserRole.ADMIN

      // Check if user is one of the authors
      const isStudentAuthor = patent.studentAuthors.some(
        author => author.user.email === session.user.email
      )
      const isFacultyAuthor = patent.facultyAuthors.some(
        author => author.user.email === session.user.email
      )

      if (!isAdmin && !isStudentAuthor && !isFacultyAuthor) {
        return NextResponse.json(
          { error: 'Unauthorized to view this patent' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ patent })
  } catch (error) {
    console.error('Error fetching patent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update patent
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

    // 1. Fetch current patent status & author mapping
    const existingPatent = await prisma.patent.findUnique({
      where: { id },
      include: {
        studentAuthors: true,
        facultyAuthors: true,
      }
    })

    if (!existingPatent) {
      return NextResponse.json(
        { error: 'Patent not found' },
        { status: 404 }
      )
    }

    const userRole = session.user.role
    const userId = session.user.id

    // 2. Validate user role permissions to modify this specific patent
    if (userRole === UserRole.STUDENT) {
      const isAuthor = existingPatent.studentAuthors.some(
        (sa) => sa.userId === userId
      )
      if (!isAuthor) {
        return NextResponse.json(
          { error: "Unauthorized - You can only edit your own patents" },
          { status: 403 }
        )
      }

      // Students can only edit before publication and when requested update or newly uploaded
      const isLocked =
        existingPatent.patentStatus === PatentStatus.GRANTED ||
        existingPatent.teacherStatus === TeacherStatus.ACCEPTED ||
        existingPatent.teacherStatus === TeacherStatus.REJECTED ||
        existingPatent.teacherStatus === TeacherStatus.PUBLISHED

      if (isLocked) {
        return NextResponse.json(
          { error: "This patent is locked and cannot be edited by students" },
          { status: 403 }
        )
      }

      // Prevent student from updating status fields directly
      delete body.patentStatus
      delete body.teacherStatus
      delete body.isPublic
    } else if (userRole === UserRole.FACULTY) {
      const isAssigned = existingPatent.facultyAuthors.some(
        (fa) => fa.userId === userId
      )
      if (!isAssigned) {
        return NextResponse.json(
          { error: "Unauthorized - You are not assigned to review this patent" },
          { status: 403 }
        )
      }

      // Faculty cannot make patent public directly
      if (body.isPublic === true) {
        return NextResponse.json(
          { error: "Unauthorized - Faculty cannot make patents public" },
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
    const currentPatentStatus = existingPatent.patentStatus
    const currentTeacherStatus = existingPatent.teacherStatus

    const newPatentStatus = body.patentStatus as PatentStatus | undefined
    const newTeacherStatus = body.teacherStatus as TeacherStatus | undefined

    // Validation rules for Patent Status
    if (newPatentStatus && newPatentStatus !== currentPatentStatus) {
      // Only admins can change status to GRANTED
      if (newPatentStatus === PatentStatus.GRANTED && userRole !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: "Only administrators can grant patents" },
          { status: 403 }
        )
      }

      // Disallow transitions out of GRANTED
      if (currentPatentStatus === PatentStatus.GRANTED) {
        return NextResponse.json(
          { error: "Cannot modify status of a granted patent" },
          { status: 400 }
        )
      }
    }

    // Validation rules for Teacher Status
    if (newTeacherStatus && newTeacherStatus !== currentTeacherStatus) {
      // Disallow: REJECTED -> ACCEPTED
      if (currentTeacherStatus === TeacherStatus.REJECTED && newTeacherStatus === TeacherStatus.ACCEPTED) {
        return NextResponse.json(
          { error: "Cannot transition status from REJECTED to ACCEPTED" },
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

      // Lock rejected
      if (currentTeacherStatus === TeacherStatus.REJECTED) {
        return NextResponse.json(
          { error: "This patent is rejected and locked" },
          { status: 400 }
        )
      }
    }

    // Automated transitions
    // Student edits own patent under UPDATE -> teacherStatus changes back to UPLOADED, clear updateComment
    if (userRole === UserRole.STUDENT && currentTeacherStatus === TeacherStatus.UPDATE) {
      body.teacherStatus = TeacherStatus.UPLOADED
      body.updateComment = null
    }

    // Accept: teacherStatus = ACCEPTED -> patentStatus becomes UNDER_REVIEW (ready for admin)
    if (newTeacherStatus === TeacherStatus.ACCEPTED) {
      body.patentStatus = PatentStatus.UNDER_REVIEW
    }

    // Admin grant approval: patentStatus = GRANTED -> isPublic becomes true
    if (newPatentStatus === PatentStatus.GRANTED) {
      body.isPublic = true
      body.teacherStatus = TeacherStatus.PUBLISHED
    }

    // 4. Validate final merged record against Zod Schema
    const mergedData = {
      title: body.title !== undefined ? body.title : existingPatent.title,
      abstract: body.abstract !== undefined ? body.abstract : existingPatent.abstract,
      imageUrl: body.imageUrl !== undefined ? body.imageUrl : existingPatent.imageUrl,
      documentUrl: body.documentUrl !== undefined ? body.documentUrl : existingPatent.documentUrl,
      patentStatus: body.patentStatus !== undefined ? body.patentStatus : existingPatent.patentStatus,
      teacherStatus: body.teacherStatus !== undefined ? body.teacherStatus : existingPatent.teacherStatus,
      grantedPatentNo: body.grantedPatentNo !== undefined ? body.grantedPatentNo : existingPatent.grantedPatentNo,
      applicationNo: body.applicationNo !== undefined ? body.applicationNo : existingPatent.applicationNo,
      patentLink: body.patentLink !== undefined ? body.patentLink : existingPatent.patentLink,
      isPublic: body.isPublic !== undefined ? body.isPublic : existingPatent.isPublic,
      keywords: body.keywords !== undefined ? body.keywords : existingPatent.keywords,
      filingDate: body.filingDate !== undefined ? body.filingDate : existingPatent.filingDate,
      submissionDate: body.submissionDate !== undefined ? body.submissionDate : existingPatent.submissionDate,
      publicationDate: body.publicationDate !== undefined ? body.publicationDate : existingPatent.publicationDate,
      grantDate: body.grantDate !== undefined ? body.grantDate : existingPatent.grantDate,
      studentAuthorIds: body.studentAuthorIds !== undefined ? body.studentAuthorIds : existingPatent.studentAuthors.map((sa) => sa.userId),
      facultyAuthorIds: body.facultyAuthorIds !== undefined ? body.facultyAuthorIds : existingPatent.facultyAuthors.map((fa) => fa.userId),
      updateComment: body.updateComment !== undefined ? body.updateComment : existingPatent.updateComment,
    }

    const validationResult = patentSchema.safeParse(mergedData)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message, details: validationResult.error.issues },
        { status: 400 }
      )
    }

    // 5. Check database author ids validity (if modified)
    if (body.studentAuthorIds) {
      const validStudents = await prisma.user.findMany({
        where: {
          id: { in: body.studentAuthorIds },
          role: UserRole.STUDENT,
        }
      })
      if (validStudents.length !== body.studentAuthorIds.length) {
        return NextResponse.json(
          { error: "One or more student authors are invalid" },
          { status: 400 }
        )
      }
      if (userRole === UserRole.STUDENT && !body.studentAuthorIds.includes(userId)) {
        return NextResponse.json(
          { error: "You must remain listed as an author on your own patent" },
          { status: 400 }
        )
      }
    }

    if (body.facultyAuthorIds) {
      const validFaculty = await prisma.user.findMany({
        where: {
          id: { in: body.facultyAuthorIds },
          role: UserRole.FACULTY,
        }
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
      "title",
      "abstract",
      "imageUrl",
      "documentUrl",
      "patentStatus",
      "teacherStatus",
      "grantedPatentNo",
      "applicationNo",
      "patentLink",
      "isPublic",
      "keywords",
      "updateComment",
    ]

    for (const field of directFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (body.filingDate !== undefined) {
      updateData.filingDate = body.filingDate ? new Date(body.filingDate) : null
    }
    if (body.submissionDate !== undefined) {
      updateData.submissionDate = body.submissionDate ? new Date(body.submissionDate) : null
    }
    if (body.publicationDate !== undefined) {
      updateData.publicationDate = body.publicationDate ? new Date(body.publicationDate) : null
    }
    if (body.grantDate !== undefined) {
      updateData.grantDate = body.grantDate ? new Date(body.grantDate) : null
    }

    if (body.studentAuthorIds !== undefined) {
      await prisma.patentStudentAuthor.deleteMany({
        where: { patentId: id }
      })
      updateData.studentAuthors = {
        create: body.studentAuthorIds.map((uId: string) => ({
          userId: uId,
        }))
      }
    }

    if (body.facultyAuthorIds !== undefined) {
      await prisma.patentTeacherAuthor.deleteMany({
        where: { patentId: id }
      })
      updateData.facultyAuthors = {
        create: body.facultyAuthorIds.map((uId: string) => ({
          userId: uId,
        }))
      }
    }

    const patent = await prisma.patent.update({
      where: { id },
      data: updateData,
      include: {
        studentAuthors: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
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
                email: true
              }
            }
          }
        }
      }
    })

    // Create notifications based on status transitions
    const studentUserIds = patent.studentAuthors.map((sa) => sa.userId)
    const facultyUserIds = patent.facultyAuthors.map((fa) => fa.userId)

    const notifyUser = async (uId: string, title: string, message: string, type: string) => {
      try {
        await prisma.notification.create({
          data: {
            userId: uId,
            title,
            message,
            type,
            link: `/dashboard/patent?id=${id}`,
          }
        })
      } catch (err) {
        console.error("Failed to create notification for user", uId, err)
      }
    }

    // Trigger status transition notifications
    if (newTeacherStatus && newTeacherStatus !== currentTeacherStatus) {
      if (newTeacherStatus === TeacherStatus.ACCEPTED) {
        for (const sId of studentUserIds) {
          await notifyUser(
            sId,
            "Patent Approved by Faculty",
            `Your patent '${patent.title}' has been accepted by the faculty reviewer.`,
            "PATENT_APPROVED"
          )
        }
        // Notify Admins
        const admins = await prisma.user.findMany({
          where: { role: UserRole.ADMIN },
          select: { id: true }
        })
        for (const admin of admins) {
          await notifyUser(
            admin.id,
            "Patent Ready for Verification",
            `The patent '${patent.title}' has been approved by the reviewer and is ready for admin action.`,
            "PATENT_APPROVED"
          )
        }
      } else if (newTeacherStatus === TeacherStatus.UPDATE) {
        for (const sId of studentUserIds) {
          await notifyUser(
            sId,
            "Revision Requested for Patent",
            `The reviewer requested corrections for '${patent.title}'. Reason: ${body.updateComment || "Please view details."}`,
            "PATENT_UPDATE_REQUESTED"
          )
        }
      } else if (newTeacherStatus === TeacherStatus.REJECTED) {
        for (const sId of studentUserIds) {
          await notifyUser(
            sId,
            "Patent Rejected",
            `Your patent '${patent.title}' was rejected by the reviewer.`,
            "PATENT_REJECTED"
          )
        }
      } else if (newTeacherStatus === TeacherStatus.UPLOADED) {
        for (const fId of facultyUserIds) {
          await notifyUser(
            fId,
            "Patent Resubmitted for Review",
            `A co-authored patent '${patent.title}' has been resubmitted for review.`,
            "PATENT_SUBMITTED"
          )
        }
      }
    }

    if (newPatentStatus && newPatentStatus !== currentPatentStatus) {
      if (newPatentStatus === PatentStatus.GRANTED) {
        for (const sId of studentUserIds) {
          await notifyUser(
            sId,
            "Patent Granted!",
            `Your patent '${patent.title}' has been marked as GRANTED by the administrator.`,
            "PATENT_PUBLISHED"
          )
        }
        for (const fId of facultyUserIds) {
          await notifyUser(
            fId,
            "Patent Granted!",
            `The co-authored patent '${patent.title}' has been marked as GRANTED.`,
            "PATENT_PUBLISHED"
          )
        }
      }
    }

    return NextResponse.json({ patent })
  } catch (error) {
    console.error('Error updating patent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete single patent
export async function DELETE(
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

    const patent = await prisma.patent.findUnique({
      where: { id },
      include: { facultyAuthors: true }
    })

    if (!patent) {
      return NextResponse.json(
        { error: 'Patent not found' },
        { status: 404 }
      )
    }

    const userRole = session.user.role
    const userId = session.user.id

    // Secure checking: Only admins can delete anything, faculty can delete patents they review/co-author, students cannot delete
    if (userRole === UserRole.STUDENT) {
      return NextResponse.json(
        { error: 'Unauthorized - Students cannot delete patents' },
        { status: 403 }
      )
    }

    if (userRole === UserRole.FACULTY) {
      const isAssigned = patent.facultyAuthors.some((fa) => fa.userId === userId)
      if (!isAssigned) {
        return NextResponse.json(
          { error: 'Unauthorized - You can only delete patents you are assigned to' },
          { status: 403 }
        )
      }
    }

    await prisma.patent.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Patent deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting patent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
