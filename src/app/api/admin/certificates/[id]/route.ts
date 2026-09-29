import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { CertificateStatus } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  try {
    const cert = await prisma.certificate.findUnique({
      where: { id: params.id },
      include: { user: { select: { id: true, name: true, email: true, department: true, role: true } } },
    });
    if (!cert) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: cert });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  try {
    if (!await prisma.certificate.findUnique({ where: { id: params.id } }))
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });

    const body = await req.json();
    if (body.certificateStatus && !Object.values(CertificateStatus).includes(body.certificateStatus))
      return NextResponse.json({ error: "Invalid certificateStatus" }, { status: 400 });

    const data: any = {};
    for (const f of ["certificateStatus","isPublic","title","description","keywords","offeredBy","documentUrl","remark","updateComment"]) {
      if (body[f] !== undefined) data[f] = body[f];
    }
    if (body.dateOfCompletion !== undefined)
      data.dateOfCompletion = body.dateOfCompletion ? new Date(body.dateOfCompletion) : null;

    const cert = await prisma.certificate.update({ where: { id: params.id }, data });
    return NextResponse.json({ success: true, data: cert });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  try {
    if (!await prisma.certificate.findUnique({ where: { id: params.id } }))
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    await prisma.certificate.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: "Certificate deleted" });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
