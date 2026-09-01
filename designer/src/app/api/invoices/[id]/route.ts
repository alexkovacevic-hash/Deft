import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, studioGuard } from "@/lib/api";
import { recalcInvoice } from "@/lib/billing";

const schema = z.object({
  issueDate: z.string().optional(),
  dueDate: z.string().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  terms: z.string().max(5000).nullable().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).optional(),
  status: z.enum(["DRAFT", "SENT", "VOID"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await studioGuard("invoices.manage");
    const { id } = await params;
    const existing = await prisma.invoice.findFirst({
      where: { id, organizationId: ctx.organizationId },
    });
    if (!existing) throw new ApiError(404, "Invoice not found.");

    const body = schema.parse(await req.json());
    const data: Prisma.InvoiceUpdateInput = {};

    if (body.issueDate) data.issueDate = new Date(body.issueDate);
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.terms !== undefined) data.terms = body.terms;
    if (body.taxRate !== undefined) data.taxRate = new Prisma.Decimal(body.taxRate);
    if (body.discount !== undefined) data.discount = new Prisma.Decimal(body.discount);

    if (body.status) {
      if (existing.status === "PAID") throw new ApiError(409, "A paid invoice cannot change status.");
      data.status = body.status;
      if (body.status === "SENT" && !existing.sentAt) data.sentAt = new Date();
    }

    await prisma.invoice.update({ where: { id }, data });
    const invoice = await recalcInvoice(id);
    return NextResponse.json({ invoice });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await studioGuard("invoices.manage");
    const { id } = await params;
    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId: ctx.organizationId },
      include: { payments: { select: { id: true } }, lineItems: { select: { timeEntryId: true } } },
    });
    if (!invoice) throw new ApiError(404, "Invoice not found.");
    if (invoice.payments.length > 0) throw new ApiError(409, "Void this invoice instead — it has payments.");

    const timeEntryIds = invoice.lineItems.map((l) => l.timeEntryId).filter((v): v is string => Boolean(v));

    await prisma.$transaction([
      prisma.timeEntry.updateMany({ where: { id: { in: timeEntryIds } }, data: { invoicedAt: null } }),
      prisma.invoice.delete({ where: { id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
