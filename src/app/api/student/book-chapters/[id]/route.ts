import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  withAuth,
  successResponse,
  updatedResponse,
  deletedResponse,
  notFoundResponse,
  forbiddenResponse,
  handleApiError,
  updateBookChapterSchema,
  userBasicSelect,
  isUserAuthor,
} from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async ({ user }) => {
    try {
      const bookChapter = await prisma.bookChapter.findUnique({
        where: { id: params.id },
        include: {
          studentAuthors: { include: { user: { select: userBasicSelect } } },
          facultyAuthors: { include: { user: { select: userBasicSelect } } },
          grantMappings: {
            include: {
              grantIn: {
                select: {
                  id: true,
                  projectCode: true,
                  grantInStatus: true,
                  amountGranted: true,
                },
              },
            },
          },
        },
      });

      if (!bookChapter) return notFoundResponse("Book chapter");

      const isAuthor = await isUserAuthor("bookChapter", params.id, user.id);
      if (!isAuthor) {
        return forbiddenResponse("You can only view your own book chapters");
      }

      return successResponse(bookChapter);
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async ({ user }) => {
    try {
      const isAuthor = await isUserAuthor("bookChapter", params.id, user.id);
      if (!isAuthor) {
        return forbiddenResponse("You can only update your own book chapters");
      }

      const existing = await prisma.bookChapter.findUnique({
        where: { id: params.id },
        select: { bookChapterStatus: true, teacherStatus: true },
      });

      if (!existing) return notFoundResponse("Book chapter");

      if (
        existing.bookChapterStatus !== "SUBMITTED" ||
        existing.teacherStatus === "PUBLISHED"
      ) {
        return forbiddenResponse(
          "Cannot update book chapter after it has been reviewed"
        );
      }

      const body = await req.json();
      const validated = updateBookChapterSchema.parse(body);

      const bookChapter = await prisma.bookChapter.update({
        where: { id: params.id },
        data: {
          ...(validated.title && { title: validated.title }),
          ...(validated.abstract !== undefined && {
            abstract: validated.abstract,
          }),
          ...(validated.isbnIssn !== undefined && {
            isbnIssn: validated.isbnIssn,
          }),
          ...(validated.publisher !== undefined && {
            publisher: validated.publisher,
          }),
          ...(validated.publicationDate && {
            publicationDate: new Date(validated.publicationDate),
          }),
          ...(validated.doi !== undefined && { doi: validated.doi }),
          ...(validated.keywords && { keywords: validated.keywords }),
          ...(validated.registrationFees !== undefined && {
            registrationFees: validated.registrationFees,
          }),
          ...(validated.reimbursement !== undefined && {
            reimbursement: validated.reimbursement,
          }),
          ...(validated.imageUrl !== undefined && {
            imageUrl: validated.imageUrl,
          }),
          ...(validated.documentUrl !== undefined && {
            documentUrl: validated.documentUrl,
          }),
        },
        include: {
          studentAuthors: { include: { user: { select: userBasicSelect } } },
          facultyAuthors: { include: { user: { select: userBasicSelect } } },
        },
      });

      return updatedResponse(bookChapter, "Book chapter updated successfully");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async ({ user }) => {
    try {
      const isAuthor = await isUserAuthor("bookChapter", params.id, user.id);
      if (!isAuthor) {
        return forbiddenResponse("You can only delete your own book chapters");
      }

      const existing = await prisma.bookChapter.findUnique({
        where: { id: params.id },
        select: { bookChapterStatus: true },
      });

      if (!existing) return notFoundResponse("Book chapter");

      if (existing.bookChapterStatus !== "SUBMITTED") {
        return forbiddenResponse(
          "Cannot delete book chapter after it has been reviewed"
        );
      }

      await prisma.bookChapter.delete({ where: { id: params.id } });

      return deletedResponse("Book chapter deleted successfully");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}
