import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, studioGuard } from "@/lib/api";
import { can } from "@/lib/tenant";

const schema = z.object({
  workDate: z.string().optional(),
  minutes: z.number().int().min(1).max(24 * 60).optional(),
  description: z.string().min(1).max(1000).optional(),
  hourlyRate: z.number().nonnegative().optional(),
  billable: z.boolean().optional(),
});

async function editableEntry(ctx: Awaited<ReturnType<typeof studioGuard>>, id: string) {
  const entry = await prisma.timeEntry.findFirst({ where: { id, organizationId: ctx.organizationId } });
  if (!entry) throw new ApiError(404, "Time entry not found.");
  if (entry.userId !== ctx.userId && !can(ctx, "time.manage_all")) {
    throw new ApiError(403, "You may only edit your own time.");
  }
  if (entry.invoicedAt) throw new ApiError(409, "This entry is already on an invoice.");
  return entry;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await studioGuard("time.log");
    const { id } = await params;
    await editableEntry(ctx, id);
    const body = schema.parse(await req.json());

    const entry = await prisma.timeEntry.update({
      where: { id },
      data: {
        ...(body.workDate ? { workDate: new Date(body.workDate) } : {}),
        ...(body.minutes !== undefined ? { minutes: body.minutes } : {}),
        ...(body.description !== undefined ? { description: body.description.trim() } : {}),
        ...(body.hourlyRate !== undefined ? { hourlyRate: new Prisma.Decimal(body.hourlyRate) } : {}),
        ...(body.billable !== undefined ? { billable: body.billable } : {}),
      },
    });
    return NextResponse.json({ entry });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await studioGuard("time.log");
    const { id } = await params;
    await editableEntry(ctx, id);
    await prisma.timeEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
