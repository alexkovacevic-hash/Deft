import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, studioGuard } from "@/lib/api";
import { recalcInvoice, selectionToLine, timeEntryToLine } from "@/lib/billing";

const schema = z.object({
  timeEntryIds: z.array(z.string()).optional(),
  selectionIds: z.array(z.string()).optional(),
});

/**
 * Pulls unbilled time and approved selections onto a draft invoice. Time
 * entries are stamped as invoiced so they can't be billed twice.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await studioGuard("invoices.manage");
    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({ where: { id, organizationId: ctx.organizationId } });
    if (!invoice) throw new ApiError(404, "Invoice not found.");
    if (invoice.status === "PAID" || invoice.status === "VOID") {
      throw new ApiError(409, "This invoice can no longer be edited.");
    }

    const body = schema.parse(await req.json());
    const timeEntryIds = body.timeEntryIds ?? [];
    const selectionIds = body.selectionIds ?? [];
    if (timeEntryIds.length === 0 && selectionIds.length === 0) {
      throw new ApiError(422, "Choose at least one item to add.");
    }

    // Only entries for this studio, this client, still unbilled and billable.
    const entries = await prisma.timeEntry.findMany({
      where: {
        id: { in: timeEntryIds },
        organizationId: ctx.organizationId,
        billable: true,
        invoicedAt: null,
        project: { clientId: invoice.clientId, ...(invoice.projectId ? { id: invoice.projectId } : {}) },
      },
    });

    const selections = await prisma.selection.findMany({
      where: {
        id: { in: selectionIds },
        organizationId: ctx.organizationId,
        status: { in: ["APPROVED", "ORDERED", "SHIPPED", "DELIVERED", "INSTALLED"] },
        project: { clientId: invoice.clientId, ...(invoice.projectId ? { id: invoice.projectId } : {}) },
        lineItems: { none: { invoice: { status: { not: "VOID" } } } },
      },
    });

    let sortOrder = await prisma.invoiceLineItem.count({ where: { invoiceId: id } });

    await prisma.$transaction([
      ...entries.map((entry) =>
        prisma.invoiceLineItem.create({
          data: { invoiceId: id, sortOrder: sortOrder++, ...timeEntryToLine(entry) },
        })
      ),
      ...selections.map((selection) =>
        prisma.invoiceLineItem.create({
          data: { invoiceId: id, sortOrder: sortOrder++, ...selectionToLine(selection) },
        })
      ),
      prisma.timeEntry.updateMany({
        where: { id: { in: entries.map((e) => e.id) } },
        data: { invoicedAt: new Date() },
      }),
    ]);

    const updated = await recalcInvoice(id);
    return NextResponse.json({
      invoice: updated,
      added: { time: entries.length, items: selections.length },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
