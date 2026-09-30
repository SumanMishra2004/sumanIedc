import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { ConferenceStatus, TeacherStatus, Prisma } from "@prisma/client";
import { safeUpdate, safeDelete } from "@/lib/api/security";
import { pickAllowedFields, CONFERENCE_ADMIN_FIELDS } from "@/lib/auth/field-allowlists";
import { successResponse, updatedResponse, deletedResponse, notFoundResponse, badRequestResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/error-handler";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  
  try {
    const { id } = await params;
    
    const conf = await prisma.conference.findUnique({
      where: { id },
      include: {
        studentAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
        facultyAuthors: { include: { user: { select: { id: true, name: true, email: true, department: true } } } },
        grantMappings:  { include: { grantIn: { select: { id: true, projectCode: true, amountGranted: true } } } },
      },
    });
    
    if (!conf) {
      return notFoundResponse("Conference");
    }
    
    return successResponse(conf);
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
    if (body.conferenceStatus && !Object.values(ConferenceStatus).includes(body.conferenceStatus)) {
      return badRequestResponse("Invalid conferenceStatus");
    }
    if (body.teacherStatus && !Object.values(TeacherStatus).includes(body.teacherStatus)) {
      return badRequestResponse("Invalid teacherStatus");
    }
    
    // Use field allowlist to prevent mass assignment
    const allowedData = pickAllowedFields(body, CONFERENCE_ADMIN_FIELDS);
    
    // Prepare update data with proper type conversions
    const data: Prisma.ConferenceUpdateInput = {
      ...allowedData,
    };
    
    // Parse date fields if provided
    if (body.conferenceDate !== undefined) {
      data.conferenceDate = body.conferenceDate ? new Date(body.conferenceDate) : null;
    }
    if (body.statusDate !== undefined) {
      data.statusDate = body.statusDate ? new Date(body.statusDate) : null;
    }
    
    // Use safe update to prevent race conditions
    const result = await safeUpdate(
      prisma.conference,
      id,
      data,
      "Conference"
    );
    
    if (!result.success) {
      return result.response;
    }
    
    return updatedResponse(result.data, "Conference updated successfully");
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
    const result = await safeDelete(prisma.conference, id, "Conference");
    
    if (!result.success) {
      return result.response;
    }
    
    return deletedResponse("Conference deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
