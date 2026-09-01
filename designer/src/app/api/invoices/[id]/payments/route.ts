import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, studioGuard } from "@/lib/api";
import { amountDue, recalcInvoice } from "@/lib/billing";

const schema = z.object({
  amount: z.number().positive(),
  method: z.enum(["STRIPE", "CHECK", "CASH", "ACH", "WIRE", "OTHER"]).optional(),
  reference: z.string().max(160).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  paidAt: z.string().optional(),
});

/** Records a payment taken outside the portal (check, ACH, wire, cash). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await studioGuard("payments.record");
    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({ where: { id, organizationId: ctx.organizationId } });
    if (!invoice) throw new ApiError(404, "Invoice not found.");
    if (invoice.status === "VOID") throw new ApiError(409, "This invoice is void.");

    const body = schema.parse(await req.json());
    const due = amountDue(invoice);
    if (body.amount > due + 0.005) {
      throw new ApiError(422, `That is more than the ${due.toFixed(2)} still due.`);
    }

    await prisma.payment.create({
      data: {
        invoiceId: id,
        amount: new Prisma.Decimal(body.amount),
        method: body.method ?? "CHECK",
        reference: body.reference ?? null,
        note: body.note ?? null,
        paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
        recordedById: ctx.userId,
      },
    });

    // A draft invoice being paid is implicitly issued.
    if (invoice.status === "DRAFT") {
      await prisma.invoice.update({
        where: { id },
        data: { status: "SENT", sentAt: invoice.sentAt ?? new Date() },
      });
    }

    const updated = await recalcInvoice(id);
    return NextResponse.json({ invoice: updated }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
