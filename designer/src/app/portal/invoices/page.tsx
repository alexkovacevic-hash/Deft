import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePortal } from "@/lib/tenant";
import { formatDate, formatMoney, toNumber } from "@/lib/utils";
import { Card, EmptyState, PageHeader, Stat } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Table, Td, Th } from "@/components/ui/Table";

export default async function PortalInvoicesPage() {
  const ctx = await requirePortal();
  const visible = ctx.access.filter((a) => a.canViewInvoices);
  if (visible.length === 0) redirect("/portal");

  const invoices = await prisma.invoice.findMany({
    where: {
      clientId: { in: visible.map((a) => a.clientId) },
      // Drafts stay with the studio until they're issued.
      status: { not: "DRAFT" },
    },
    orderBy: { issueDate: "desc" },
    include: { project: { select: { name: true } } },
  });

  const currency = visible[0].currency;
  const balance = invoices
    .filter((i) => i.status === "SENT" || i.status === "PARTIALLY_PAID")
    .reduce((sum, i) => sum + toNumber(i.total) - toNumber(i.amountPaid), 0);
  const paid = invoices.reduce((sum, i) => sum + toNumber(i.amountPaid), 0);

  return (
    <>
      <PageHeader title="Invoices" description="Everything billed to you, and what's still open." />

      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Balance due" value={formatMoney(balance, currency)} />
        <Stat label="Paid to date" value={formatMoney(paid, currency)} />
      </div>

      <div className="mt-6">
        {invoices.length === 0 ? (
          <EmptyState title="No invoices yet" description="Anything your designer bills will show up here." />
        ) : (
          <Card>
            <Table>
              <thead>
                <tr>
                  <Th>Invoice</Th>
                  <Th>Project</Th>
                  <Th>Issued</Th>
                  <Th>Due</Th>
                  <Th>Total</Th>
                  <Th>Balance</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-clay-50">
                    <Td>
                      <Link href={`/portal/invoices/${invoice.id}`} className="font-medium text-ink-800 hover:underline">
                        {invoice.number}
                      </Link>
                    </Td>
                    <Td className="text-ink-500">{invoice.project?.name ?? "—"}</Td>
                    <Td className="text-ink-500">{formatDate(invoice.issueDate)}</Td>
                    <Td className="text-ink-500">{formatDate(invoice.dueDate)}</Td>
                    <Td className="text-ink-700">{formatMoney(invoice.total, currency)}</Td>
                    <Td className="text-ink-700">
                      {formatMoney(toNumber(invoice.total) - toNumber(invoice.amountPaid), currency)}
                    </Td>
                    <Td><StatusBadge status={invoice.status} kind="invoice" /></Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        )}
      </div>
    </>
  );
}
