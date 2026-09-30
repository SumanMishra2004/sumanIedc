import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/auth/guard";
import { EventStatus, Prisma } from "@prisma/client";
import { safeUpdate, safeDelete } from "@/lib/api/security";
import { pickAllowedFields, EVENT_EDITOR_STATUS_FIELDS } from "@/lib/auth/field-allowlists";
import { successResponse, updatedResponse, deletedResponse, notFoundResponse, badRequestResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/error-handler";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return notFoundResponse("Event");
    return successResponse(event);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    // Fetch once to check status lock — no second fetch needed (safeUpdate handles not-found)
    const existing = await prisma.event.findUnique({ where: { id }, select: { eventStatus: true } });
    if (!existing) return notFoundResponse("Event");

    if (existing.eventStatus === "CANCELLED" || existing.eventStatus === "ARCHIVED") {
      return badRequestResponse(`Cannot edit a ${existing.eventStatus.toLowerCase()} event`);
    }

    const body = await req.json();
    if (body.eventStatus && !Object.values(EventStatus).includes(body.eventStatus)) {
      return badRequestResponse("Invalid eventStatus");
    }

    const allowedData = pickAllowedFields(body, EVENT_EDITOR_STATUS_FIELDS);
    const data: Prisma.EventUpdateInput = { ...allowedData };
    if (body.eventDate !== undefined) data.eventDate = body.eventDate ? new Date(body.eventDate) : undefined;

    const result = await safeUpdate(prisma.event, id, data, "Event");
    if (!result.success) return result.response;

    return updatedResponse(result.data, "Event updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireEditor(req);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    // Check published constraint before deleting
    const existing = await prisma.event.findUnique({ where: { id }, select: { eventStatus: true } });
    if (!existing) return notFoundResponse("Event");
    if (existing.eventStatus === "PUBLISHED") {
      return badRequestResponse("Cannot delete a published event — archive it instead");
    }

    const result = await safeDelete(prisma.event, id, "Event");
    if (!result.success) return result.response;

    return deletedResponse("Event deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
