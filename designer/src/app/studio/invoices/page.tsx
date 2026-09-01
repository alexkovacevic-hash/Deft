import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { can, requireStudio } from "@/lib/tenant";
import { formatDate, formatMoney, toNumber } from "@/lib/utils";
import { Card, EmptyState, PageHeader, Stat } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Table, Td, Th } from "@/components/ui/Table";
import { InvoiceDialogButton } from "./InvoiceDialogButton";

export default async function InvoicesPage() {
  const ctx = await requireStudio("invoices.view");

  const [invoices, clients] = await Promise.all([
    prisma.invoice.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    }),
    prisma.client.findMany({
      where: { organizationId: ctx.organizationId, status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        projects: { select: { id: true, name: true }, orderBy: { name: "asc" } },
      },
    }),
  ]);

  const currency = ctx.organization.currency;
  const open = invoices.filter((i) => i.status === "SENT" || i.status === "PARTIALLY_PAID");
  const outstanding = open.reduce((sum, i) => sum + toNumber(i.total) - toNumber(i.amountPaid), 0);
  const collected = invoices.reduce((sum, i) => sum + toNumber(i.amountPaid), 0);
  const drafts = invoices.filter((i) => i.status === "DRAFT").length;

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Bill for hours and for items, and take payment online."
        action={
          can(ctx, "invoices.manage") ? (
            <InvoiceDialogButton clients={clients} canAddClients={can(ctx, "clients.manage")} />
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Outstanding" value={formatMoney(outstanding, currency)} sub={`${open.length} open`} />
        <Stat label="Collected" value={formatMoney(collected, currency)} />
        <Stat label="Drafts" value={drafts} />
      </div>

      <div className="mt-6">
        {invoices.length === 0 ? (
          <EmptyState
            title={clients.length === 0 ? "Start with a client" : "No invoices yet"}
            description={
              clients.length === 0
                ? "Invoices are billed to a client, so add one first."
                : "Start a draft, then pull in unbilled time and approved items."
            }
            action={
              can(ctx, "invoices.manage") ? (
                <InvoiceDialogButton clients={clients} canAddClients={can(ctx, "clients.manage")} />
              ) : undefined
            }
          />
        ) : (
          <Card>
            <Table>
              <thead>
                <tr>
                  <Th>Number</Th>
                  <Th>Client</Th>
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
                      <Link href={`/studio/invoices/${invoice.id}`} className="font-medium text-ink-800 hover:underline">
                        {invoice.number}
                      </Link>
                    </Td>
                    <Td>
                      <Link href={`/studio/clients/${invoice.client.id}`} className="text-ink-500 hover:underline">
                        {invoice.client.name}
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
