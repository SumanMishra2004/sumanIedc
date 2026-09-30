import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { GrantInStatus, Prisma } from "@prisma/client";
import { safeUpdate, safeDelete } from "@/lib/api/security";
import { pickAllowedFields, GRANT_ADMIN_FIELDS } from "@/lib/auth/field-allowlists";
import { successResponse, updatedResponse, deletedResponse, notFoundResponse, badRequestResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/error-handler";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  
  try {
    const { id } = await params;
    
    const resource = await prisma.grantIn.findUnique({
      where: { id },
    });
    
    if (!resource) {
      return notFoundResponse("Grant");
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
    if (body.grantInStatus && !Object.values(GrantInStatus).includes(body.grantInStatus)) {
      return badRequestResponse("Invalid grantInStatus");
    }

    // Use field allowlist to prevent mass assignment
    const allowedData = pickAllowedFields(body, GRANT_ADMIN_FIELDS);
    
    // Prepare update data with proper type conversions
    const data: Prisma.GrantUpdateInput = {
      ...allowedData,
    };

    // Parse date fields if provided
    if (body.applicationDate !== undefined) {
      data.applicationDate = body.applicationDate ? new Date(body.applicationDate) : null;
    }
    if (body.grantDate !== undefined) {
      data.grantDate = body.grantDate ? new Date(body.grantDate) : null;
    }
  
    // Use safe update to prevent race conditions
    const result = await safeUpdate(
      prisma.grantIn,
      id,
      data,
      "Grant"
    );
    
    if (!result.success) {
      return result.response;
    }
    
    return updatedResponse(result.data, "Grant updated successfully");
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
    const result = await safeDelete(prisma.grantIn, id, "Grant");
    
    if (!result.success) {
      return result.response;
    }
    
    return deletedResponse("Grant deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
