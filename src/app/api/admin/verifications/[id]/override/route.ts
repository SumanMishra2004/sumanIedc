import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";

const overrideSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
  reason: z.string().min(1).max(500),
});

// POST /api/admin/verifications/[id]/override
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
    const { id } = await params;

  try {
    const existing = await prisma.facultyVerificationRequest.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Verification request not found" }, { status: 404 });

    const body = await req.json();
    const { status, reason } = overrideSchema.parse(body);

    const updated = await prisma.facultyVerificationRequest.update({
      where: { id },
      data: {
        status,
        overrideById:   guard.session.user.id,
        overrideAt:     new Date(),
        overrideReason: reason,
        tokenUsed:      true,
        ...(status === "ACCEPTED" ? { verifiedAt: new Date() } : { rejectionReason: reason }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) {
    if (e?.name === "ZodError") return NextResponse.json({ error: "Invalid input", details: e.errors }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
