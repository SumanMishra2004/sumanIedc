import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { PatentStatus, Prisma, TeacherStatus } from "@prisma/client";
import { safeUpdate, safeDelete } from "@/lib/api/security";
import { pickAllowedFields, PATENT_ADMIN_FIELDS } from "@/lib/auth/field-allowlists";
import { successResponse, updatedResponse, deletedResponse, notFoundResponse, badRequestResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/error-handler";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  
  try {
    const { id } = await params;
    
    const resource = await prisma.patent.findUnique({
      where: { id },
    });
    
    if (!resource) {
      return notFoundResponse("Patent");
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
    if (body.patentStatus && !Object.values(PatentStatus).includes(body.patentStatus)) {
      return badRequestResponse("Invalid patentStatus");
    }
    if (body.teacherStatus && !Object.values(TeacherStatus).includes(body.teacherStatus)) {
      return badRequestResponse("Invalid teacherStatus");
    }

    // Use field allowlist to prevent mass assignment
    const allowedData = pickAllowedFields(body, PATENT_ADMIN_FIELDS);
    
    // Prepare update data with proper type conversions
    const data: Prisma.PatentUpdateInput = {
      ...allowedData,
    };

    // Parse date fields if provided
    if (body.filingDate !== undefined) {
      data.filingDate = body.filingDate ? new Date(body.filingDate) : null;
    }
    if (body.submissionDate !== undefined) {
      data.submissionDate = body.submissionDate ? new Date(body.submissionDate) : null;
    }
    if (body.publicationDate !== undefined) {
      data.publicationDate = body.publicationDate ? new Date(body.publicationDate) : null;
    }
    if (body.grantDate !== undefined) {
      data.grantDate = body.grantDate ? new Date(body.grantDate) : null;
    }
  
    // Use safe update to prevent race conditions
    const result = await safeUpdate(
      prisma.patent,
      id,
      data,
      "Patent"
    );
    
    if (!result.success) {
      return result.response;
    }
    
    return updatedResponse(result.data, "Patent updated successfully");
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
    const result = await safeDelete(prisma.patent, id, "Patent");
    
    if (!result.success) {
      return result.response;
    }
    
    return deletedResponse("Patent deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
