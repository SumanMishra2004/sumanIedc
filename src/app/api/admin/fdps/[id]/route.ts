import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { FDPStatus, Prisma } from "@prisma/client";
import { safeUpdate, safeDelete } from "@/lib/api/security";
import { successResponse, updatedResponse, deletedResponse, notFoundResponse, badRequestResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/error-handler";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  
  try {
    const { id } = await params;
    
    const resource = await prisma.fDP.findUnique({
      where: { id },
    });
    
    if (!resource) {
      return notFoundResponse("FDP");
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
    if (body.fdpStatus && !Object.values(FDPStatus).includes(body.fdpStatus)) {
      return badRequestResponse("Invalid fdpStatus");
    }

    // Prepare update data (TODO: Add field allowlist for this resource)
    const data: Prisma.FDPUpdateInput = body;

    // Parse date fields if provided
    if (body.startDate !== undefined) {
      data.startDate = body.startDate ? new Date(body.startDate) : null;
    }
    if (body.endDate !== undefined) {
      data.endDate = body.endDate ? new Date(body.endDate) : null;
    }
  
    // Use safe update to prevent race conditions
    const result = await safeUpdate(
      prisma.fDP,
      id,
      data,
      "FDP"
    );
    
    if (!result.success) {
      return result.response;
    }
    
    return updatedResponse(result.data, "FDP updated successfully");
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
    const result = await safeDelete(prisma.fDP, id, "FDP");
    
    if (!result.success) {
      return result.response;
    }
    
    return deletedResponse("FDP deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
