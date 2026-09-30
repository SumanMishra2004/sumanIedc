import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { BookchapterStatus, TeacherStatus, Prisma } from "@prisma/client";
import { safeUpdate, safeDelete } from "@/lib/api/security";
import { pickAllowedFields, BOOK_CHAPTER_ADMIN_FIELDS } from "@/lib/auth/field-allowlists";
import { successResponse, updatedResponse, deletedResponse, notFoundResponse, badRequestResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/error-handler";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  
  try {
    const { id } = await params;
    
    const bc = await prisma.bookChapter.findUnique({
      where: { id },
      include: {
        studentAuthors: { 
          include: { 
            user: { 
              select: { id: true, name: true, email: true, department: true } 
            } 
          } 
        },
        facultyAuthors: { 
          include: { 
            user: { 
              select: { id: true, name: true, email: true, department: true } 
            } 
          } 
        },
        grantMappings: { 
          include: { 
            grantIn: { 
              select: { id: true, projectCode: true, amountGranted: true } 
            } 
          } 
        },
      },
    });
    
    if (!bc) {
      return notFoundResponse("Book chapter");
    }
    
    return successResponse(bc);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  
  try {
    const { id } = await params;
    const body = await req.json();
    
    // Validate status enums if provided
    if (body.bookChapterStatus && !Object.values(BookchapterStatus).includes(body.bookChapterStatus)) {
      return badRequestResponse("Invalid bookChapterStatus");
    }
    if (body.teacherStatus && !Object.values(TeacherStatus).includes(body.teacherStatus)) {
      return badRequestResponse("Invalid teacherStatus");
    }
    
    // Use field allowlist to prevent mass assignment
    const allowedData = pickAllowedFields(body, BOOK_CHAPTER_ADMIN_FIELDS);
    
    // Prepare update data with proper type conversions
    const data: Prisma.BookChapterUpdateInput = {
      ...allowedData,
    };
    
    // Parse date field if provided
    if (body.publicationDate !== undefined) {
      data.publicationDate = body.publicationDate ? new Date(body.publicationDate) : null;
    }
    
    // Use safe update to prevent race conditions
    const result = await safeUpdate<typeof prisma.bookChapter extends { update: (args: any) => Promise<infer R> } ? R : never>(
      prisma.bookChapter,
      id,
      data,
      "Book chapter"
    );
    
    if (!result.success) {
      return result.response;
    }
    
    return updatedResponse(result.data, "Book chapter updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  
  try {
    const { id } = await params;
    
    // Use safe delete to prevent race conditions
    const result = await safeDelete(prisma.bookChapter, id, "Book chapter");
    
    if (!result.success) {
      return result.response;
    }
    
    return deletedResponse("Book chapter deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
