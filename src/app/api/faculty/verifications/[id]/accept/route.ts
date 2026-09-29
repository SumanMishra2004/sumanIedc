import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withRole, successResponse, notFoundResponse, forbiddenResponse, badRequestResponse, handleApiError } from "@/lib/api";

// POST /api/faculty/verifications/[id]/accept
// Faculty accepts a verification request sent to them
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole("FACULTY", async ({ user }) => {
    try {
      const verification = await prisma.facultyVerificationRequest.findUnique({
        where: { id: params.id },
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

      // Only the linked faculty or a faculty with matching email can accept
      if (
        verification.linkedFacultyId !== user.id &&
        verification.facultyEmail.toLowerCase() !== user.email.toLowerCase()
      ) {
        return forbiddenResponse("This verification request is not for you");
      }

      if (verification.status !== "PENDING") {
        return badRequestResponse(`Verification is already ${verification.status.toLowerCase()}`);
      }

      if (verification.tokenUsed) {
        return badRequestResponse("Verification token has already been used");
      }

      if (new Date(verification.tokenExpiry) < new Date()) {
        return badRequestResponse("Verification token has expired");
      }

      const updated = await prisma.facultyVerificationRequest.update({
        where: { id: params.id },
        data: {
          status: "ACCEPTED",
          tokenUsed: true,
          verifiedAt: new Date(),
          linkedFacultyId: user.id,
        },
      });

      return successResponse(updated, "Verification accepted successfully");
    } catch (error) { return handleApiError(error); }
  })(req);
}
