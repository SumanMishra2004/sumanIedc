import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { withRole, successResponse, notFoundResponse, forbiddenResponse, badRequestResponse, handleApiError } from "@/lib/api";

const rejectSchema = z.object({
  reason: z.string().min(1).max(500),
});

// POST /api/faculty/verifications/[id]/reject
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
    const { id } = await params;
      const verification = await prisma.facultyVerificationRequest.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          facultyEmail: true,
          tokenUsed: true,
          tokenExpiry: true,
          linkedFacultyId: true,
        },
      });

      if (!verification) return notFoundResponse("Verification request");

      if (
        verification.linkedFacultyId !== user.id &&
        verification.facultyEmail.toLowerCase() !== user.email.toLowerCase()
      ) {
        return forbiddenResponse("This verification request is not for you");
      }

      if (verification.status !== "PENDING") {
        return badRequestResponse(`Verification is already ${verification.status.toLowerCase()}`);
      }

      const body = await req.json();
      const { reason } = rejectSchema.parse(body);

      const updated = await prisma.facultyVerificationRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          tokenUsed: true,
          rejectionReason: reason,
        },
      });

      return successResponse(updated, "Verification rejected");
    } catch (error) { return handleApiError(error); }
  })(req);
}
