import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { CertificateStatus, Prisma } from "@prisma/client";
import { safeUpdate, safeDelete } from "@/lib/api/security";
import { successResponse, updatedResponse, deletedResponse, notFoundResponse, badRequestResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/error-handler";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  
  try {
    const { id } = await params;
    
    const resource = await prisma.certificate.findUnique({
      where: { id },
    });
    
    if (!resource) {
      return notFoundResponse("Certificate");
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
    if (body.certificateStatus && !Object.values(CertificateStatus).includes(body.certificateStatus)) {
      return badRequestResponse("Invalid certificateStatus");
    }

    // Prepare update data (TODO: Add field allowlist for this resource)
    const data: Prisma.CertificateUpdateInput = body;

    // Use safe update to prevent race conditions
    const result = await safeUpdate(
      prisma.certificate,
      id,
      data,
      "Certificate"
    );
    
    if (!result.success) {
      return result.response;
    }
    
    return updatedResponse(result.data, "Certificate updated successfully");
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
    const result = await safeDelete(prisma.certificate, id, "Certificate");
    
    if (!result.success) {
      return result.response;
    }
    
    return deletedResponse("Certificate deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
