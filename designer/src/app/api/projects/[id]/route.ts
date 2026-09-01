import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, studioGuard } from "@/lib/api";
import { projectScope } from "@/lib/tenant";

const schema = z.object({
  name: z.string().min(1).max(160).optional(),
  description: z.string().max(5000).nullable().optional(),
  status: z.enum(["LEAD", "PROPOSAL", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]).optional(),
  startDate: z.string().nullable().optional(),
  targetDate: z.string().nullable().optional(),
  budget: z.number().nonnegative().nullable().optional(),
  hourlyRate: z.number().nonnegative().nullable().optional(),
  leadUserId: z.string().nullable().optional(),
  coverImageUrl: z.string().url().or(z.literal("")).nullable().optional(),
  visibleToClient: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await studioGuard("projects.manage");
    const { id } = await params;
    const existing = await prisma.project.findFirst({ where: { id, ...projectScope(ctx) } });
    if (!existing) throw new ApiError(404, "Project not found.");

    const body = schema.parse(await req.json());
    const data: Prisma.ProjectUpdateInput = {};

    if (body.name !== undefined) data.name = body.name.trim();
    if (body.description !== undefined) data.description = body.description;
    if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.targetDate !== undefined) data.targetDate = body.targetDate ? new Date(body.targetDate) : null;
    if (body.budget !== undefined) data.budget = body.budget == null ? null : new Prisma.Decimal(body.budget);
    if (body.hourlyRate !== undefined) {
      data.hourlyRate = body.hourlyRate == null ? null : new Prisma.Decimal(body.hourlyRate);
    }
    if (body.coverImageUrl !== undefined) data.coverImageUrl = body.coverImageUrl || null;
    if (body.visibleToClient !== undefined) data.visibleToClient = body.visibleToClient;
    if (body.leadUserId !== undefined) {
      if (body.leadUserId) {
        const lead = await prisma.membership.findFirst({
          where: { organizationId: ctx.organizationId, userId: body.leadUserId },
          select: { id: true },
        });
        if (!lead) throw new ApiError(422, "The chosen lead is not a member of this studio.");
        data.lead = { connect: { id: body.leadUserId } };
      } else {
        data.lead = { disconnect: true };
      }
    }
    if (body.status !== undefined) {
      data.status = body.status;
      // Stamp or clear the completion date so "finished" lists stay accurate.
      if (body.status === "COMPLETED") data.completedAt = existing.completedAt ?? new Date();
      else if (existing.status === "COMPLETED") data.completedAt = null;
    }

    const project = await prisma.project.update({ where: { id }, data });
    return NextResponse.json({ project });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await studioGuard("projects.delete");
    const { id } = await params;
    const project = await prisma.project.findFirst({
      where: { id, organizationId: ctx.organizationId },
      select: { id: true },
    });
    if (!project) throw new ApiError(404, "Project not found.");

    const invoices = await prisma.invoice.count({ where: { projectId: id } });
    if (invoices > 0) throw new ApiError(409, "This project has invoices. Archive it instead.");

    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
