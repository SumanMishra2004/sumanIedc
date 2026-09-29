import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/auth/guard";
import { CertificateStatus } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;
  try {
    const cert = await prisma.certificate.findUnique({
      where: { id: params.id },
      include: { user: { select: { id: true, name: true, email: true, department: true, role: true } } },
    });
    if (!cert) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: cert });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;
  try {
    const existing = await prisma.certificate.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });

    const body = await req.json();
    if (body.certificateStatus && !Object.values(CertificateStatus).includes(body.certificateStatus)) {
      return NextResponse.json({ error: "Invalid certificateStatus" }, { status: 400 });
    }

    const updateData: any = {};
    for (const f of ["certificateStatus", "isPublic", "title", "description", "keywords",
      "offeredBy", "documentUrl", "remark", "updateComment"]) {
      if (body[f] !== undefined) updateData[f] = body[f];
    }
    if (body.dateOfCompletion !== undefined) {
      updateData.dateOfCompletion = body.dateOfCompletion ? new Date(body.dateOfCompletion) : null;
    }

    const cert = await prisma.certificate.update({ where: { id: params.id }, data: updateData });
    return NextResponse.json({ success: true, data: cert });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
