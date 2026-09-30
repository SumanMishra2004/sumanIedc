import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/auth/guard";
import { CertificateStatus, Prisma } from "@prisma/client";
import { safeUpdate } from "@/lib/api/security";
import { successResponse, updatedResponse, notFoundResponse, badRequestResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/error-handler";

// Certificate-editor allowlist (no teacherStatus on certificates)
const CERTIFICATE_EDITOR_FIELDS = [
  "certificateStatus", "isPublic", "title", "description",
  "keywords", "offeredBy", "documentUrl", "remark", "updateComment",
] as const;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const cert = await prisma.certificate.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true, department: true, role: true } } },
    });

    if (!cert) return notFoundResponse("Certificate");
    return successResponse(cert);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await req.json();

    if (body.certificateStatus && !Object.values(CertificateStatus).includes(body.certificateStatus)) {
      return badRequestResponse("Invalid certificateStatus");
    }

    const allowedData: Record<string, unknown> = {};
    for (const f of CERTIFICATE_EDITOR_FIELDS) {
      if (body[f] !== undefined) allowedData[f] = body[f];
    }
    const data: Prisma.CertificateUpdateInput = { ...allowedData };
    if (body.dateOfCompletion !== undefined) {
      data.dateOfCompletion = body.dateOfCompletion ? new Date(body.dateOfCompletion) : undefined;
    }

    const result = await safeUpdate(prisma.certificate, id, data, "Certificate");
    if (!result.success) return result.response;

    return updatedResponse(result.data, "Certificate updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
