import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ConferenceStatus, TeacherStatus, UserRole, ConferenceMode } from '@prisma/client'
import { conferenceSchema } from '@/lib/validations/conference'

// GET - List all conferences with filtering, pagination, and search
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const searchParams = req.nextUrl.searchParams

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Filters
    const conferenceStatus = searchParams.get('conferenceStatus')
    const teacherStatus = searchParams.get('teacherStatus')
    const isPublic = searchParams.get('isPublic')
    const keyword = searchParams.get('keyword')
    const conferenceName = searchParams.get('conferenceName')
    const mode = searchParams.get('mode')
    const search = searchParams.get('search')

    // Date range filters
    const minDate = searchParams.get('minDate') // conferenceDate
    const maxDate = searchParams.get('maxDate')

    // Fee range filters
    const minRegistrationFees = searchParams.get('minRegistrationFees')
    const maxRegistrationFees = searchParams.get('maxRegistrationFees')
    const minReimbursement = searchParams.get('minReimbursement')
    const maxReimbursement = searchParams.get('maxReimbursement')

    // Build where clause
    const where: any = {}

    // Access control based on role
    if (!session) {
      // Not logged in - only public items
      where.isPublic = true
    } else if (session.user.role === UserRole.STUDENT) {
      // Students see: public items OR items where they are authors
      where.OR = [
        
        { studentAuthors: { some: { userId: session.user.id } } }
      ]
    } else if (session.user.role === UserRole.FACULTY) {
      // Faculty see: public items OR items where they are authors
      where.OR = [

        { facultyAuthors: { some: { userId: session.user.id } } }
      ]
    }
    // ADMIN sees everything - no filter needed

    // Apply filters
    if (conferenceStatus) {
      where.conferenceStatus = conferenceStatus as ConferenceStatus
    }

    if (teacherStatus) {
      where.teacherStatus = teacherStatus as TeacherStatus
    }

    if (mode) {
      where.mode = mode as ConferenceMode
    }

    if (isPublic !== null && isPublic !== undefined) {
      where.isPublic = isPublic === 'true'
    }

    if (keyword) {
      where.keywords = {
        has: keyword
      }
    }

    if (conferenceName) {
      where.conferenceName = {
        contains: conferenceName,
        mode: 'insensitive'
      }
    }

    // Search across multiple fields
    if (search) {
      where.OR = [
        { conferenceName: { contains: search, mode: 'insensitive' } },
        { paperName: { contains: search, mode: 'insensitive' } },
        { abstract: { contains: search, mode: 'insensitive' } },
        { conferencePublisher: { contains: search, mode: 'insensitive' } },
        { paperDoi: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Date range filters
    if (minDate || maxDate) {
      where.conferenceDate = {}
      if (minDate) where.conferenceDate.gte = new Date(minDate)
      if (maxDate) where.conferenceDate.lte = new Date(maxDate)
    }

    // Fee range filters
    if (minRegistrationFees || maxRegistrationFees) {
      where.registrationFees = {}
      if (minRegistrationFees) where.registrationFees.gte = parseFloat(minRegistrationFees)
      if (maxRegistrationFees) where.registrationFees.lte = parseFloat(maxRegistrationFees)
    }

    if (minReimbursement || maxReimbursement) {
      where.reimbursement = {}
      if (minReimbursement) where.reimbursement.gte = parseFloat(minReimbursement)
      if (maxReimbursement) where.reimbursement.lte = parseFloat(maxReimbursement)
    }

    // Fetch data with pagination
    const [conferences, total] = await Promise.all([
      prisma.conference.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder
        },
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
      }),
      prisma.conference.count({ where })
    ])

    return NextResponse.json({
      conferences,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching conferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate using Zod schema
    const validation = conferenceSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message, details: validation.error.issues },
        { status: 400 }
      )
    }

    const {
      conferenceName,
      paperName,
      abstract,
      imageUrl,
      documentUrl,
      conferenceStatus,
      teacherStatus,
      mode,
      registrationFees,
      reimbursement,
      isPublic,
      keywords,
      paperDoi,
      paperLink,
      conferenceDate,
      conferencePublisher,
      studentAuthorIds,
      facultyAuthorIds
    } = validation.data

    /* -------------------- Validate faculty authors -------------------- */
    const facultyAuthors = await prisma.user.findMany({
      where: {
        id: { in: facultyAuthorIds },
        role: UserRole.FACULTY
      }
    })

    if (facultyAuthors.length !== facultyAuthorIds.length) {
      return NextResponse.json(
        { error: "One or more faculty authors are invalid" },
        { status: 400 }
      )
    }

    /* -------------------- Validate student authors -------------------- */
    const studentAuthors = await prisma.user.findMany({
      where: {
        id: { in: studentAuthorIds },
        role: UserRole.STUDENT
      }
    })

    if (studentAuthors.length !== studentAuthorIds.length) {
      return NextResponse.json(
        { error: "One or more student authors are invalid" },
        { status: 400 }
      )
    }

    /* -------------------- Create Conference -------------------- */
    const conference = await prisma.conference.create({
      data: {
        conferenceName,
        paperName,
        abstract,
        imageUrl,
        documentUrl,
        conferenceStatus: conferenceStatus ?? ConferenceStatus.SUBMITTED,
        teacherStatus: teacherStatus ?? TeacherStatus.UPLOADED,
        mode: mode ?? ConferenceMode.OFFLINE,
        registrationFees,
        reimbursement,
        isPublic,
        keywords: keywords ?? [],
        paperDoi,
        paperLink,
        conferenceDate: conferenceDate ? new Date(conferenceDate) : null,
        conferencePublisher,
        studentAuthors: {
          create: studentAuthorIds.map((userId: string) => ({
            userId
          }))
        },
        facultyAuthors: {
          create: facultyAuthorIds.map((userId: string) => ({
            userId
          }))
        }
      },
      include: {
        studentAuthors: {
          include: { user: true }
        },
        facultyAuthors: {
          include: { user: true }
        }
      }
    })

    // Trigger Notifications for faculty co-authors
    for (const faculty of facultyAuthors) {
      try {
        await prisma.notification.create({
          data: {
            userId: faculty.id,
            title: "New Conference Co-Authored",
            message: `A new conference submission '${conference.conferenceName}' has been uploaded and lists you as co-author.`,
            type: "CONFERENCE_SUBMITTED",
            link: `/dashboard/conferences?id=${conference.id}`,
          }
        })
      } catch (err) {
        console.error("Failed to notify faculty co-author:", err)
      }
    }

    return NextResponse.json(
      { conference },
      { status: 201 }
    )

  } catch (error) {
    console.error("Conference POST error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Bulk delete conferences
export async function DELETE(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role === UserRole.STUDENT) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin or Faculty access required' },
        { status: 403 }
      )
    }

    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs array is required' },
        { status: 400 }
      )
    }

    // Delete conferences (cascade will handle authors)
    const result = await prisma.conference.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    return NextResponse.json({
      message: `Successfully deleted ${result.count} conference(s)`,
      count: result.count
    })
  } catch (error) {
    console.error('Error deleting conferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
