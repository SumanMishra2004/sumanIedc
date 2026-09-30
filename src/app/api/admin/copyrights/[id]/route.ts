import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { CopyrightStatus, Prisma, TeacherStatus } from "@prisma/client";
import { safeUpdate, safeDelete } from "@/lib/api/security";
import { pickAllowedFields, COPYRIGHT_ADMIN_FIELDS } from "@/lib/auth/field-allowlists";
import { successResponse, updatedResponse, deletedResponse, notFoundResponse, badRequestResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/error-handler";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  
  try {
    const { id } = await params;
    
    const resource = await prisma.copyright.findUnique({
      where: { id },
    });
    
    if (!resource) {
      return notFoundResponse("Copyright");
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
    if (body.copyrightStatus && !Object.values(CopyrightStatus).includes(body.copyrightStatus)) {
      return badRequestResponse("Invalid copyrightStatus");
    }
    if (body.teacherStatus && !Object.values(TeacherStatus).includes(body.teacherStatus)) {
      return badRequestResponse("Invalid teacherStatus");
    }

    // Use field allowlist to prevent mass assignment
    const allowedData = pickAllowedFields(body, COPYRIGHT_ADMIN_FIELDS);
    
    // Prepare update data with proper type conversions
    const data: Prisma.CopyrightUpdateInput = {
      ...allowedData,
    };

    // Parse date fields if provided
    if (body.dateOfFiling !== undefined) {
      data.dateOfFiling = body.dateOfFiling ? new Date(body.dateOfFiling) : null;
    }
    if (body.dateOfSubmission !== undefined) {
      data.dateOfSubmission = body.dateOfSubmission ? new Date(body.dateOfSubmission) : null;
    }
    if (body.dateOfPublished !== undefined) {
      data.dateOfPublished = body.dateOfPublished ? new Date(body.dateOfPublished) : null;
    }
    if (body.dateOfGrant !== undefined) {
      data.dateOfGrant = body.dateOfGrant ? new Date(body.dateOfGrant) : null;
    }
  
    // Use safe update to prevent race conditions
    const result = await safeUpdate(
      prisma.copyright,
      id,
      data,
      "Copyright"
    );
    
    if (!result.success) {
      return result.response;
    }
    
    return updatedResponse(result.data, "Copyright updated successfully");
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
    const result = await safeDelete(prisma.copyright, id, "Copyright");
    
    if (!result.success) {
      return result.response;
    }
    
    return deletedResponse("Copyright deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
