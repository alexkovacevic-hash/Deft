import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { toNumber } from "./utils";

const round = (n: number) => Math.round(n * 100) / 100;

export function lineAmount(quantity: unknown, unitPrice: unknown): number {
  return round(toNumber(quantity) * toNumber(unitPrice));
}

export type Totals = { subtotal: number; taxAmount: number; total: number };

export function computeTotals(
  lines: { quantity: unknown; unitPrice: unknown }[],
  discount: unknown,
  taxRate: unknown
): Totals {
  const subtotal = round(lines.reduce((sum, l) => sum + lineAmount(l.quantity, l.unitPrice), 0));
  const taxable = Math.max(0, round(subtotal - toNumber(discount)));
  const taxAmount = round((taxable * toNumber(taxRate)) / 100);
  return { subtotal, taxAmount, total: round(taxable + taxAmount) };
}

/**
 * Recomputes an invoice's stored totals and status from its line items and
 * payments. Called after any edit so the summary columns never drift.
 * VOID invoices keep their status; DRAFT is only advanced by an explicit send.
 */
export async function recalcInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lineItems: true, payments: true },
  });
  if (!invoice) return null;

  const { subtotal, taxAmount, total } = computeTotals(
    invoice.lineItems,
    invoice.discount,
    invoice.taxRate
  );
  const amountPaid = Math.round(invoice.payments.reduce((s, p) => s + toNumber(p.amount), 0) * 100) / 100;

  let status = invoice.status;
  let paidAt = invoice.paidAt;
  if (status !== "VOID" && status !== "DRAFT") {
    if (amountPaid <= 0) {
      status = "SENT";
      paidAt = null;
    } else if (amountPaid + 0.005 < total) {
      status = "PARTIALLY_PAID";
      paidAt = null;
    } else {
      status = "PAID";
      paidAt = paidAt ?? new Date();
    }
  }

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      subtotal: new Prisma.Decimal(subtotal),
      taxAmount: new Prisma.Decimal(taxAmount),
      total: new Prisma.Decimal(total),
      amountPaid: new Prisma.Decimal(amountPaid),
      status,
      paidAt,
    },
  });
}

/** Sequential per-studio invoice number, e.g. INV-0007. */
export async function nextInvoiceNumber(organizationId: string, prefix: string): Promise<string> {
  const count = await prisma.invoice.count({ where: { organizationId } });
  let n = count + 1;
  // Guard against gaps from deleted invoices producing a collision.
  for (let attempt = 0; attempt < 50; attempt++) {
    const number = `${prefix}-${String(n).padStart(4, "0")}`;
    const clash = await prisma.invoice.findFirst({
      where: { organizationId, number },
      select: { id: true },
    });
    if (!clash) return number;
    n += 1;
  }
  return `${prefix}-${Date.now()}`;
}

export function amountDue(invoice: { total: unknown; amountPaid: unknown }): number {
  return Math.max(0, round(toNumber(invoice.total) - toNumber(invoice.amountPaid)));
}

/**
 * Turns unbilled billable time entries into invoice line items, one per entry,
 * priced at the rate snapshotted when the entry was logged.
 */
export function timeEntryToLine(entry: {
  id: string;
  workDate: Date;
  minutes: number;
  description: string;
  hourlyRate: unknown;
}) {
  const hours = round(entry.minutes / 60);
  return {
    kind: "TIME" as const,
    description: `${entry.workDate.toISOString().slice(0, 10)} — ${entry.description}`,
    quantity: new Prisma.Decimal(hours),
    unitPrice: new Prisma.Decimal(toNumber(entry.hourlyRate)),
    amount: new Prisma.Decimal(round(hours * toNumber(entry.hourlyRate))),
    timeEntryId: entry.id,
  };
}

export function selectionToLine(selection: {
  id: string;
  name: string;
  vendor: string | null;
  quantity: number;
  unitPrice: unknown;
}) {
  return {
    kind: "ITEM" as const,
    description: selection.vendor ? `${selection.name} (${selection.vendor})` : selection.name,
    quantity: new Prisma.Decimal(selection.quantity),
    unitPrice: new Prisma.Decimal(toNumber(selection.unitPrice)),
    amount: new Prisma.Decimal(round(selection.quantity * toNumber(selection.unitPrice))),
    selectionId: selection.id,
  };
}
