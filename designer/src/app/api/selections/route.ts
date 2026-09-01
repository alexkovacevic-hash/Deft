import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, studioGuard } from "@/lib/api";
import { assertProjectAccess } from "@/lib/tenant";

const schema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().nullable().optional(),
  name: z.string().min(1).max(200),
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

export async function POST(req: Request) {
  try {
    const ctx = await studioGuard("selections.manage");
    const body = schema.parse(await req.json());
    await assertProjectAccess(ctx, body.projectId);

    if (body.roomId) {
      const room = await prisma.room.findFirst({
        where: { id: body.roomId, projectId: body.projectId },
        select: { id: true },
      });
      if (!room) throw new ApiError(422, "That room is not part of this project.");
    }

    const sortOrder = await prisma.selection.count({ where: { projectId: body.projectId } });

    const selection = await prisma.selection.create({
      data: {
        organizationId: ctx.organizationId,
        projectId: body.projectId,
        roomId: body.roomId || null,
        name: body.name.trim(),
        vendor: body.vendor ?? null,
        sku: body.sku ?? null,
        description: body.description ?? null,
        productUrl: body.productUrl || null,
        imageUrl: body.imageUrl || null,
        quantity: body.quantity ?? 1,
        unitCost: body.unitCost == null ? null : new Prisma.Decimal(body.unitCost),
        unitPrice: new Prisma.Decimal(body.unitPrice ?? 0),
        leadTimeWeeks: body.leadTimeWeeks ?? null,
        status: body.status ?? "DRAFT",
        designerNote: body.designerNote ?? null,
        sortOrder,
      },
    });
    return NextResponse.json({ selection }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
