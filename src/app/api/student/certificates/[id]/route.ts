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
  updateCertificateSchema,
} from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async ({ user }) => {
    try {
      const certificate = await prisma.certificate.findUnique({
        where: { id: params.id },
      });

      if (!certificate) return notFoundResponse("Certificate");
      if (certificate.userId !== user.id) {
        return forbiddenResponse("You can only view your own certificates");
      }

      return successResponse(certificate);
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
      const existing = await prisma.certificate.findUnique({
        where: { id: params.id },
        select: { userId: true, certificateStatus: true },
      });

      if (!existing) return notFoundResponse("Certificate");
      if (existing.userId !== user.id) {
        return forbiddenResponse("You can only update your own certificates");
      }

      if (existing.certificateStatus !== "SUBMITTED") {
        return forbiddenResponse(
          "Cannot update certificate after it has been reviewed"
        );
      }

      const body = await req.json();
      const validated = updateCertificateSchema.parse(body);

      const certificate = await prisma.certificate.update({
        where: { id: params.id },
        data: {
          ...(validated.title && { title: validated.title }),
          ...(validated.description !== undefined && {
            description: validated.description,
          }),
          ...(validated.keywords && { keywords: validated.keywords }),
          ...(validated.documentUrl !== undefined && {
            documentUrl: validated.documentUrl,
          }),
          ...(validated.offeredBy !== undefined && {
            offeredBy: validated.offeredBy,
          }),
          ...(validated.dateOfCompletion && {
            dateOfCompletion: new Date(validated.dateOfCompletion),
          }),
          ...(validated.remark !== undefined && { remark: validated.remark }),
        },
      });

      return updatedResponse(certificate, "Certificate updated successfully");
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
      const existing = await prisma.certificate.findUnique({
        where: { id: params.id },
        select: { userId: true, certificateStatus: true },
      });

      if (!existing) return notFoundResponse("Certificate");
      if (existing.userId !== user.id) {
        return forbiddenResponse("You can only delete your own certificates");
      }

      if (existing.certificateStatus !== "SUBMITTED") {
        return forbiddenResponse(
          "Cannot delete certificate after it has been reviewed"
        );
      }

      await prisma.certificate.delete({ where: { id: params.id } });

      return deletedResponse("Certificate deleted successfully");
    } catch (error) {
      return handleApiError(error);
    }
  })(req);
}
