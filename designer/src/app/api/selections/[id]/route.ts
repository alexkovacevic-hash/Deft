import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, studioGuard } from "@/lib/api";
import { projectScope } from "@/lib/tenant";

const schema = z.object({
  roomId: z.string().nullable().optional(),
  name: z.string().min(1).max(200).optional(),
  vendor: z.string().max(160).nullable().optional(),
  sku: z.string().max(120).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  productUrl: z.string().url().or(z.literal("")).nullable().optional(),
  imageUrl: z.string().url().or(z.literal("")).nullable().optional(),
  quantity: z.number().int().min(1).max(9999).optional(),
  unitCost: z.number().nonnegative().nullable().optional(),
  unitPrice: z.number().nonnegative().optional(),
  leadTimeWeeks: z.number().int().min(0).max(260).nullable().optional(),
  status: z
    .enum(["DRAFT", "PROPOSED", "APPROVED", "REJECTED", "ORDERED", "SHIPPED", "DELIVERED", "INSTALLED"])
    .optional(),
  designerNote: z.string().max(5000).nullable().optional(),
});

async function ownedSelection(ctx: Awaited<ReturnType<typeof studioGuard>>, id: string) {
  const selection = await prisma.selection.findFirst({
    where: { id, organizationId: ctx.organizationId, project: projectScope(ctx) },
  });
  if (!selection) throw new ApiError(404, "Selection not found.");
  return selection;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await studioGuard("selections.manage");
    const { id } = await params;
    const existing = await ownedSelection(ctx, id);
    const body = schema.parse(await req.json());

    if (body.roomId) {
      const room = await prisma.room.findFirst({
        where: { id: body.roomId, projectId: existing.projectId },
        select: { id: true },
      });
      if (!room) throw new ApiError(422, "That room is not part of this project.");
    }

    const data: Prisma.SelectionUpdateInput = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.vendor !== undefined) data.vendor = body.vendor;
    if (body.sku !== undefined) data.sku = body.sku;
    if (body.description !== undefined) data.description = body.description;
    if (body.productUrl !== undefined) data.productUrl = body.productUrl || null;
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl || null;
    if (body.quantity !== undefined) data.quantity = body.quantity;
    if (body.unitCost !== undefined) {
      data.unitCost = body.unitCost == null ? null : new Prisma.Decimal(body.unitCost);
    }
    if (body.unitPrice !== undefined) data.unitPrice = new Prisma.Decimal(body.unitPrice);
    if (body.leadTimeWeeks !== undefined) data.leadTimeWeeks = body.leadTimeWeeks;
    if (body.designerNote !== undefined) data.designerNote = body.designerNote;
    if (body.roomId !== undefined) {
      data.room = body.roomId ? { connect: { id: body.roomId } } : { disconnect: true };
    }
    if (body.status !== undefined) {
      data.status = body.status;
      // Re-proposing clears the previous client decision.
      if (body.status === "PROPOSED" || body.status === "DRAFT") {
        data.decidedAt = null;
        data.decidedBy = { disconnect: true };
      }
    }

    const selection = await prisma.selection.update({ where: { id }, data });
    return NextResponse.json({ selection });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await studioGuard("selections.manage");
    const { id } = await params;
    await ownedSelection(ctx, id);
    await prisma.selection.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
