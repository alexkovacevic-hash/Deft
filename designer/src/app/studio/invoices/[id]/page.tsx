import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { can, requireStudio } from "@/lib/tenant";
import { amountDue } from "@/lib/billing";
import { formatDate, formatMoney, toNumber } from "@/lib/utils";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { InvoiceEditor } from "./InvoiceEditor";
import { PaymentPanel } from "./PaymentPanel";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireStudio("invoices.view");
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId: ctx.organizationId },
    include: {
      client: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
      lineItems: { orderBy: { sortOrder: "asc" } },
      payments: {
        orderBy: { paidAt: "desc" },
        include: { recordedBy: { select: { name: true, email: true } } },
      },
    },
  });
  if (!invoice) notFound();

  // What could still be pulled onto this invoice.
  const projectFilter = invoice.projectId ? { id: invoice.projectId } : {};
  const [billableTime, billableItems] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        organizationId: ctx.organizationId,
        billable: true,
        invoicedAt: null,
        project: { clientId: invoice.clientId, ...projectFilter },
      },
      orderBy: { workDate: "asc" },
      include: { project: { select: { name: true } } },
    }),
    prisma.selection.findMany({
      where: {
        organizationId: ctx.organizationId,
        status: { in: ["APPROVED", "ORDERED", "SHIPPED", "DELIVERED", "INSTALLED"] },
        project: { clientId: invoice.clientId, ...projectFilter },
        lineItems: { none: { invoice: { status: { not: "VOID" } } } },
      },
      orderBy: { createdAt: "asc" },
      include: { project: { select: { name: true } } },
    }),
  ]);

  const currency = ctx.organization.currency;
  const balance = amountDue(invoice);

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/studio/invoices" className="hover:underline">Invoices</Link>}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {invoice.number}
            <StatusBadge status={invoice.status} kind="invoice" />
          </span>
        }
        description={
          <>
            <Link href={`/studio/clients/${invoice.client.id}`} className="hover:underline">
              {invoice.client.name}
            </Link>
            {invoice.project && (
              <>
                {" · "}
                <Link href={`/studio/projects/${invoice.project.id}`} className="hover:underline">
                  {invoice.project.name}
                </Link>
              </>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <InvoiceEditor
            invoiceId={invoice.id}
            status={invoice.status}
            currency={currency}
            canManage={can(ctx, "invoices.manage")}
            taxRate={String(invoice.taxRate)}
            discount={String(invoice.discount)}
            lineItems={invoice.lineItems.map((l) => ({
              id: l.id,
              kind: l.kind,
              description: l.description,
              quantity: String(l.quantity),
              unitPrice: String(l.unitPrice),
              amount: String(l.amount),
            }))}
            billableTime={billableTime.map((e) => ({
              id: e.id,
              workDate: e.workDate.toISOString(),
              minutes: e.minutes,
              description: e.description,
              hourlyRate: String(e.hourlyRate),
              projectName: e.project.name,
            }))}
            billableItems={billableItems.map((s) => ({
              id: s.id,
              name: s.name,
              vendor: s.vendor,
              quantity: s.quantity,
              unitPrice: String(s.unitPrice),
              projectName: s.project.name,
            }))}
          />

          <PaymentPanel
            invoiceId={invoice.id}
            currency={currency}
            balance={balance}
            canRecord={can(ctx, "payments.record")}
            payments={invoice.payments.map((p) => ({
              id: p.id,
              amount: String(p.amount),
              method: p.method,
              reference: p.reference,
              paidAt: p.paidAt.toISOString(),
              recordedBy: p.recordedBy?.name ?? p.recordedBy?.email ?? null,
            }))}
          />
        </div>

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
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Details" />
            <CardBody className="space-y-2 text-sm">
              <Row label="Issued" value={formatDate(invoice.issueDate)} />
              <Row label="Due" value={formatDate(invoice.dueDate)} />
              <Row label="Sent" value={formatDate(invoice.sentAt)} />
              <Row label="Paid in full" value={formatDate(invoice.paidAt)} />
              {invoice.notes && <p className="pt-2 text-xs text-ink-500">{invoice.notes}</p>}
              {invoice.terms && <p className="pt-2 text-xs text-ink-400">{invoice.terms}</p>}
            </CardBody>
          </Card>
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
