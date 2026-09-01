import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePortal } from "@/lib/tenant";
import { amountDue } from "@/lib/billing";
import { formatDate, formatMoney, toNumber } from "@/lib/utils";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Table, Td, Th } from "@/components/ui/Table";
import { PayButton } from "./PayButton";

export default async function PortalInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const ctx = await requirePortal();
  const { id } = await params;
  const { paid } = await searchParams;

  const visible = ctx.access.filter((a) => a.canViewInvoices);
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      status: { not: "DRAFT" },
      clientId: { in: visible.map((a) => a.clientId) },
    },
    include: {
      organization: { select: { name: true, addressLine1: true, city: true, state: true, postalCode: true, phone: true } },
      project: { select: { name: true } },
      lineItems: { orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { paidAt: "desc" } },
    },
  });
  if (!invoice) notFound();

  const access = visible.find((a) => a.clientId === invoice.clientId)!;
  const currency = access.currency;
  const balance = amountDue(invoice);

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/portal/invoices" className="hover:underline">Invoices</Link>}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {invoice.number}
            <StatusBadge status={invoice.status} kind="invoice" />
          </span>
        }
        description={`From ${invoice.organization.name}${invoice.project ? ` · ${invoice.project.name}` : ""}`}
      />

      {paid && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-sage-500/40 bg-sage-100 px-4 py-3 text-sm text-sage-700">
          <CheckCircle2 className="h-4 w-4" />
          Thanks — your payment is on its way. This page updates once Stripe confirms it.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="What you're being billed for" />
          <Table>
            <thead>
              <tr>
                <Th>Description</Th>
                <Th className="text-right">Qty</Th>
                <Th className="text-right">Rate</Th>
                <Th className="text-right">Amount</Th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item) => (
                <tr key={item.id}>
                  <Td>{item.description}</Td>
                  <Td className="text-right text-ink-500">{Number(item.quantity)}</Td>
                  <Td className="text-right text-ink-500">{formatMoney(item.unitPrice, currency)}</Td>
                  <Td className="text-right text-ink-800">{formatMoney(item.amount, currency)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {invoice.notes && (
            <CardBody className="border-t border-clay-100">
              <p className="text-sm text-ink-500">{invoice.notes}</p>
            </CardBody>
          )}
          {invoice.terms && (
            <CardBody className="border-t border-clay-100">
              <p className="text-xs text-ink-400">{invoice.terms}</p>
            </CardBody>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Summary" />
            <CardBody className="space-y-2 text-sm">
              <Row label="Subtotal" value={formatMoney(invoice.subtotal, currency)} />
              {toNumber(invoice.discount) > 0 && (
                <Row label="Discount" value={`− ${formatMoney(invoice.discount, currency)}`} />
              )}
              {toNumber(invoice.taxRate) > 0 && (
                <Row label={`Tax (${Number(invoice.taxRate)}%)`} value={formatMoney(invoice.taxAmount, currency)} />
              )}
              <div className="border-t border-clay-100 pt-2">
                <Row label="Total" value={formatMoney(invoice.total, currency)} strong />
              </div>
              <Row label="Paid" value={formatMoney(invoice.amountPaid, currency)} />
              <Row label="Balance" value={formatMoney(balance, currency)} strong />
              <p className="pt-1 text-xs text-ink-400">
                Issued {formatDate(invoice.issueDate)} · due {formatDate(invoice.dueDate)}
              </p>
            </CardBody>
          </Card>

          {balance > 0 && access.canPayInvoices && (
            <PayButton invoiceId={invoice.id} balance={balance} currency={currency} />
          )}
          {balance > 0 && !access.canPayInvoices && (
            <p className="text-xs text-ink-400">
              Payment is handled by whoever settles invoices for this project.
            </p>
          )}

          {invoice.payments.length > 0 && (
            <Card>
              <CardHeader title="Payments received" />
              <CardBody>
                <ul className="divide-y divide-clay-100">
                  {invoice.payments.map((payment) => (
                    <li key={payment.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-ink-500">
                        {payment.method.charAt(0) + payment.method.slice(1).toLowerCase()}
                        <span className="block text-xs text-ink-400">{formatDate(payment.paidAt)}</span>
                      </span>
                      <span className="text-ink-800">{formatMoney(payment.amount, currency)}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-400">{label}</span>
      <span className={strong ? "font-semibold text-ink-900" : "text-ink-700"}>{value}</span>
    </div>
  );
}
