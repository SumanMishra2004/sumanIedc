import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { JournalStatus, Prisma, TeacherStatus } from "@prisma/client";
import { safeUpdate, safeDelete } from "@/lib/api/security";
import { pickAllowedFields, JOURNAL_ADMIN_FIELDS } from "@/lib/auth/field-allowlists";
import { successResponse, updatedResponse, deletedResponse, notFoundResponse, badRequestResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/error-handler";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  
  try {
    const { id } = await params;
    
    const resource = await prisma.journal.findUnique({
      where: { id },
    });
    
    if (!resource) {
      return notFoundResponse("Journal");
    }
    
    return successResponse(resource);
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
    if (body.journalStatus && !Object.values(JournalStatus).includes(body.journalStatus)) {
      return badRequestResponse("Invalid journalStatus");
    }
    if (body.teacherStatus && !Object.values(TeacherStatus).includes(body.teacherStatus)) {
      return badRequestResponse("Invalid teacherStatus");
    }

    // Use field allowlist to prevent mass assignment
    const allowedData = pickAllowedFields(body, JOURNAL_ADMIN_FIELDS);
    
    // Prepare update data with proper type conversions
    const data: Prisma.JournalUpdateInput = {
      ...allowedData,
    };

    // Parse date fields if provided
    if (body.publicationDate !== undefined) {
      data.publicationDate = body.publicationDate ? new Date(body.publicationDate) : null;
    }
    if (body.impactFactorDate !== undefined) {
      data.impactFactorDate = body.impactFactorDate ? new Date(body.impactFactorDate) : null;
    }
  
    // Use safe update to prevent race conditions
    const result = await safeUpdate(
      prisma.journal,
      id,
      data,
      "Journal"
    );
    
    if (!result.success) {
      return result.response;
    }
    
    return updatedResponse(result.data, "Journal updated successfully");
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
    const result = await safeDelete(prisma.journal, id, "Journal");
    
    if (!result.success) {
      return result.response;
    }
    
    return deletedResponse("Journal deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
