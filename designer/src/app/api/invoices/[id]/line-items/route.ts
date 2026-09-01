import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, studioGuard } from "@/lib/api";
import { lineAmount, recalcInvoice } from "@/lib/billing";

const schema = z.object({
  kind: z.enum(["TIME", "ITEM", "EXPENSE", "CUSTOM"]).optional(),
  description: z.string().min(1).max(500),
  quantity: z.number().min(0).max(100000).optional(),
  unitPrice: z.number().optional(),
});

async function editableInvoice(organizationId: string, id: string) {
  const invoice = await prisma.invoice.findFirst({ where: { id, organizationId } });
  if (!invoice) throw new ApiError(404, "Invoice not found.");
  if (invoice.status === "PAID" || invoice.status === "VOID") {
    throw new ApiError(409, "This invoice can no longer be edited.");
  }
  return invoice;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await studioGuard("invoices.manage");
    const { id } = await params;
    await editableInvoice(ctx.organizationId, id);

    const body = schema.parse(await req.json());
    const quantity = body.quantity ?? 1;
    const unitPrice = body.unitPrice ?? 0;
    const sortOrder = await prisma.invoiceLineItem.count({ where: { invoiceId: id } });

    await prisma.invoiceLineItem.create({
      data: {
        invoiceId: id,
        kind: body.kind ?? "CUSTOM",
        description: body.description.trim(),
        quantity: new Prisma.Decimal(quantity),
        unitPrice: new Prisma.Decimal(unitPrice),
        amount: new Prisma.Decimal(lineAmount(quantity, unitPrice)),
        sortOrder,
      },
    });

    const invoice = await recalcInvoice(id);
    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
