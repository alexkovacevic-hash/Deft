import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, studioGuard } from "@/lib/api";
import { lineAmount, recalcInvoice } from "@/lib/billing";
import { toNumber } from "@/lib/utils";

const schema = z.object({
  description: z.string().min(1).max(500).optional(),
  quantity: z.number().min(0).max(100000).optional(),
  unitPrice: z.number().optional(),
});

async function editableLine(organizationId: string, invoiceId: string, itemId: string) {
  const line = await prisma.invoiceLineItem.findFirst({
    where: { id: itemId, invoiceId, invoice: { organizationId } },
    include: { invoice: { select: { status: true } } },
  });
  if (!line) throw new ApiError(404, "Line item not found.");
  if (line.invoice.status === "PAID" || line.invoice.status === "VOID") {
    throw new ApiError(409, "This invoice can no longer be edited.");
  }
  return line;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    const ctx = await studioGuard("invoices.manage");
    const { id, itemId } = await params;
    const line = await editableLine(ctx.organizationId, id, itemId);

    const body = schema.parse(await req.json());
    const quantity = body.quantity ?? toNumber(line.quantity);
    const unitPrice = body.unitPrice ?? toNumber(line.unitPrice);

    await prisma.invoiceLineItem.update({
      where: { id: itemId },
      data: {
        ...(body.description !== undefined ? { description: body.description.trim() } : {}),
        quantity: new Prisma.Decimal(quantity),
        unitPrice: new Prisma.Decimal(unitPrice),
        amount: new Prisma.Decimal(lineAmount(quantity, unitPrice)),
      },
    });

    const invoice = await recalcInvoice(id);
    return NextResponse.json({ invoice });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    const ctx = await studioGuard("invoices.manage");
    const { id, itemId } = await params;
    const line = await editableLine(ctx.organizationId, id, itemId);

    await prisma.$transaction([
      // Releasing a time line puts those hours back in the unbilled pool.
      ...(line.timeEntryId
        ? [prisma.timeEntry.update({ where: { id: line.timeEntryId }, data: { invoicedAt: null } })]
        : []),
      prisma.invoiceLineItem.delete({ where: { id: itemId } }),
    ]);

    const invoice = await recalcInvoice(id);
    return NextResponse.json({ invoice });
  } catch (error) {
    return handleApiError(error);
  }
}
