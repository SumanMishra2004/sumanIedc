import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { UserRole, TeacherStatus, BookchapterStatus } from '@prisma/client'
import { bookChapterSchema } from '@/lib/validations/book-chapter'

// GET - Get single book chapter by ID with permission checks
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    const bookChapter = await prisma.bookChapter.findUnique({
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

    if (!bookChapter) {
      return NextResponse.json(
        { error: 'Book chapter not found' },
        { status: 404 }
      )
    }

    // Access control - check if user can view
    if (!bookChapter.isPublic) {
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
      const isStudentAuthor = bookChapter.studentAuthors.some(
        author => author.user.email === session.user.email
      )
      const isFacultyAuthor = bookChapter.facultyAuthors.some(
        author => author.user.email === session.user.email
      )

      if (!isAdmin && !isStudentAuthor && !isFacultyAuthor) {
        return NextResponse.json(
          { error: 'Unauthorized to view this book chapter' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ bookChapter })
  } catch (error) {
    console.error('Error fetching book chapter:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update book chapter with role, transition validation and Zod schema
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

    // 1. Fetch current book chapter status & author mapping
    const existingChapter = await prisma.bookChapter.findUnique({
      where: { id },
      include: {
        studentAuthors: true,
        facultyAuthors: true,
      }
    })

    if (!existingChapter) {
      return NextResponse.json(
        { error: 'Book chapter not found' },
        { status: 404 }
      )
    }

    const userRole = session.user.role
    const userId = session.user.id

    // 2. Validate user role permissions to modify this specific chapter
    if (userRole === UserRole.STUDENT) {
      const isAuthor = existingChapter.studentAuthors.some(
        (sa) => sa.userId === userId
      )
      if (!isAuthor) {
        return NextResponse.json(
          { error: "Unauthorized - You can only edit your own book chapters" },
          { status: 403 }
        )
      }

      // Students can only edit before publication and when requested update or newly uploaded
      const isLocked =
        existingChapter.bookChapterStatus === BookchapterStatus.PUBLISHED ||
        existingChapter.teacherStatus === TeacherStatus.ACCEPTED ||
        existingChapter.teacherStatus === TeacherStatus.REJECTED ||
        existingChapter.teacherStatus === TeacherStatus.PUBLISHED

      if (isLocked) {
        return NextResponse.json(
          { error: "This book chapter is locked and cannot be edited by students" },
          { status: 403 }
        )
      }

      // Prevent student from updating status fields directly
      delete body.bookChapterStatus
      delete body.teacherStatus
      delete body.isPublic
    } else if (userRole === UserRole.FACULTY) {
      const isAssigned = existingChapter.facultyAuthors.some(
        (fa) => fa.userId === userId
      )
      if (!isAssigned) {
        return NextResponse.json(
          { error: "Unauthorized - You are not assigned to review this book chapter" },
          { status: 403 }
        )
      }

      // Faculty cannot make chapter public directly
      if (body.isPublic === true) {
        return NextResponse.json(
          { error: "Unauthorized - Faculty cannot make book chapters public" },
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
    const currentChapterStatus = existingChapter.bookChapterStatus
    const currentTeacherStatus = existingChapter.teacherStatus

    const newChapterStatus = body.bookChapterStatus as BookchapterStatus | undefined
    const newTeacherStatus = body.teacherStatus as TeacherStatus | undefined

    // Validation rules for Chapter Status
    if (newChapterStatus && newChapterStatus !== currentChapterStatus) {
      // Only admins can change status to PUBLISHED
      if (newChapterStatus === BookchapterStatus.PUBLISHED && userRole !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: "Only administrators can publish book chapters" },
          { status: 403 }
        )
      }

      // Disallow transitions out of PUBLISHED
      if (currentChapterStatus === BookchapterStatus.PUBLISHED) {
        return NextResponse.json(
          { error: "Cannot modify status of a published book chapter" },
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
          { error: "This book chapter is rejected and locked" },
          { status: 400 }
        )
      }
    }

    // Automated transitions
    // Student edits own chapter under UPDATE -> teacherStatus changes back to UPLOADED, clear updateComment
    if (userRole === UserRole.STUDENT && currentTeacherStatus === TeacherStatus.UPDATE) {
      body.teacherStatus = TeacherStatus.UPLOADED
      body.updateComment = null
    }

    // Accept: teacherStatus = ACCEPTED -> bookChapterStatus becomes UNDER_REVIEW (ready for admin)
    if (newTeacherStatus === TeacherStatus.ACCEPTED) {
      body.bookChapterStatus = BookchapterStatus.UNDER_REVIEW
    }

    // Admin publication approval: bookChapterStatus = PUBLISHED -> isPublic becomes true
    if (newChapterStatus === BookchapterStatus.PUBLISHED) {
      body.isPublic = true
      body.teacherStatus = TeacherStatus.PUBLISHED
    }

    // 4. Validate final merged record against Zod Schema
    const mergedData = {
      title: body.title !== undefined ? body.title : existingChapter.title,
      abstract: body.abstract !== undefined ? body.abstract : existingChapter.abstract,
      imageUrl: body.imageUrl !== undefined ? body.imageUrl : existingChapter.imageUrl,
      documentUrl: body.documentUrl !== undefined ? body.documentUrl : existingChapter.documentUrl,
      bookChapterStatus: body.bookChapterStatus !== undefined ? body.bookChapterStatus : existingChapter.bookChapterStatus,
      teacherStatus: body.teacherStatus !== undefined ? body.teacherStatus : existingChapter.teacherStatus,
      isbnIssn: body.isbnIssn !== undefined ? body.isbnIssn : existingChapter.isbnIssn,
      registrationFees: body.registrationFees !== undefined ? (body.registrationFees ? parseFloat(body.registrationFees) : null) : existingChapter.registrationFees,
      reimbursement: body.reimbursement !== undefined ? (body.reimbursement ? parseFloat(body.reimbursement) : null) : existingChapter.reimbursement,
      isPublic: body.isPublic !== undefined ? body.isPublic : existingChapter.isPublic,
      keywords: body.keywords !== undefined ? body.keywords : existingChapter.keywords,
      doi: body.doi !== undefined ? body.doi : existingChapter.doi,
      publicationDate: body.publicationDate !== undefined ? body.publicationDate : existingChapter.publicationDate,
      publisher: body.publisher !== undefined ? body.publisher : existingChapter.publisher,
      studentAuthorIds: body.studentAuthorIds !== undefined ? body.studentAuthorIds : existingChapter.studentAuthors.map((sa) => sa.userId),
      facultyAuthorIds: body.facultyAuthorIds !== undefined ? body.facultyAuthorIds : existingChapter.facultyAuthors.map((fa) => fa.userId),
      updateComment: body.updateComment !== undefined ? body.updateComment : existingChapter.updateComment,
    }

    const validationResult = bookChapterSchema.safeParse(mergedData)
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
      "bookChapterStatus",
      "teacherStatus",
      "isbnIssn",
      "isPublic",
      "keywords",
      "doi",
      "publisher",
      "updateComment",
    ]

    for (const field of directFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
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

    if (body.studentAuthorIds !== undefined) {
      await prisma.bookChapterStudentAuthor.deleteMany({
        where: { bookChapterId: id }
      })
      updateData.studentAuthors = {
        create: body.studentAuthorIds.map((uId: string) => ({
          userId: uId,
        }))
      }
    }

    if (body.facultyAuthorIds !== undefined) {
      await prisma.bookChapterTeacherAuthor.deleteMany({
        where: { bookChapterId: id }
      })
      updateData.facultyAuthors = {
        create: body.facultyAuthorIds.map((uId: string) => ({
          userId: uId,
        }))
      }
    }

    const bookChapter = await prisma.bookChapter.update({
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
    const studentUserIds = bookChapter.studentAuthors.map((sa) => sa.userId)
    const facultyUserIds = bookChapter.facultyAuthors.map((fa) => fa.userId)

    const notifyUser = async (uId: string, title: string, message: string, type: string) => {
      try {
        await prisma.notification.create({
          data: {
            userId: uId,
            title,
            message,
            type,
            link: `/dashboard/book-chapters`,
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
            "Book Chapter Approved by Faculty",
            `Your book chapter '${bookChapter.title}' has been accepted by the faculty reviewer.`,
            "BOOK_CHAPTER_APPROVED"
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
            "Book Chapter Ready for Publication",
            `The book chapter '${bookChapter.title}' has been approved by the reviewer and is ready for final publication.`,
            "BOOK_CHAPTER_APPROVED"
          )
        }
      } else if (newTeacherStatus === TeacherStatus.UPDATE) {
        for (const sId of studentUserIds) {
          await notifyUser(
            sId,
            "Revision Requested for Book Chapter",
            `The reviewer requested corrections for '${bookChapter.title}'. Reason: ${body.updateComment || "Please view details."}`,
            "BOOK_CHAPTER_UPDATE_REQUESTED"
          )
        }
      } else if (newTeacherStatus === TeacherStatus.REJECTED) {
        for (const sId of studentUserIds) {
          await notifyUser(
            sId,
            "Book Chapter Rejected",
            `Your book chapter '${bookChapter.title}' was rejected by the reviewer.`,
            "BOOK_CHAPTER_REJECTED"
          )
        }
      } else if (newTeacherStatus === TeacherStatus.UPLOADED) {
        for (const fId of facultyUserIds) {
          await notifyUser(
            fId,
            "Book Chapter Resubmitted for Review",
            `A co-authored book chapter '${bookChapter.title}' has been resubmitted for review.`,
            "BOOK_CHAPTER_SUBMITTED"
          )
        }
      }
    }

    if (newChapterStatus && newChapterStatus !== currentChapterStatus) {
      if (newChapterStatus === BookchapterStatus.PUBLISHED) {
        for (const sId of studentUserIds) {
          await notifyUser(
            sId,
            "Book Chapter Published!",
            `Your book chapter '${bookChapter.title}' has been successfully verified and published by the administrator.`,
            "BOOK_CHAPTER_PUBLISHED"
          )
        }
        for (const fId of facultyUserIds) {
          await notifyUser(
            fId,
            "Book Chapter Published!",
            `The co-authored book chapter '${bookChapter.title}' has been successfully published.`,
            "BOOK_CHAPTER_PUBLISHED"
          )
        }
      }
    }

    return NextResponse.json({ bookChapter })
  } catch (error) {
    console.error('Error updating book chapter:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete single book chapter with permission verification
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

    const bookChapter = await prisma.bookChapter.findUnique({
      where: { id },
      include: { facultyAuthors: true }
    })

    if (!bookChapter) {
      return NextResponse.json(
        { error: 'Book chapter not found' },
        { status: 404 }
      )
    }

    const userRole = session.user.role
    const userId = session.user.id

    // Secure checking: Only admins can delete anything, faculty can delete chapters they review/co-author, students cannot delete
    if (userRole === UserRole.STUDENT) {
      return NextResponse.json(
        { error: 'Unauthorized - Students cannot delete book chapters' },
        { status: 403 }
      )
    }

    if (userRole === UserRole.FACULTY) {
      const isAssigned = bookChapter.facultyAuthors.some((fa) => fa.userId === userId)
      if (!isAssigned) {
        return NextResponse.json(
          { error: 'Unauthorized - You can only delete book chapters you are assigned to' },
          { status: 403 }
        )
      }
    }

    await prisma.bookChapter.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Book chapter deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting book chapter:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
