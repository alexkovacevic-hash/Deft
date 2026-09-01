import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { can, projectScope, requireStudio } from "@/lib/tenant";
import { formatDate, formatMoney, toNumber } from "@/lib/utils";
import { Card, CardBody, CardHeader, EmptyState, PageHeader, Stat } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Table, Td, Th } from "@/components/ui/Table";

const LIVE_STATUSES = ["LEAD", "PROPOSAL", "ACTIVE", "ON_HOLD"] as const;

export default async function StudioDashboard() {
  const ctx = await requireStudio();
  const scope = projectScope(ctx);
  const currency = ctx.organization.currency;

  const [liveProjects, clientCount, awaitingClient, unbilledTime, openInvoices] = await Promise.all([
    prisma.project.findMany({
      where: { ...scope, status: { in: [...LIVE_STATUSES] } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: {
        client: { select: { id: true, name: true } },
        lead: { select: { name: true, email: true } },
      },
    }),
    can(ctx, "clients.view")
      ? prisma.client.count({ where: { organizationId: ctx.organizationId, status: "ACTIVE" } })
      : Promise.resolve(0),
    prisma.selection.count({ where: { organizationId: ctx.organizationId, status: "PROPOSED", project: scope } }),
    prisma.timeEntry.findMany({
      where: {
        organizationId: ctx.organizationId,
        billable: true,
        invoicedAt: null,
        ...(can(ctx, "time.view_all") ? {} : { userId: ctx.userId }),
      },
      select: { minutes: true, hourlyRate: true },
    }),
    can(ctx, "invoices.view")
      ? prisma.invoice.findMany({
          where: { organizationId: ctx.organizationId, status: { in: ["SENT", "PARTIALLY_PAID"] } },
          orderBy: { dueDate: "asc" },
          take: 6,
          include: { client: { select: { id: true, name: true } } },
        })
      : Promise.resolve([]),
  ]);

  const liveCount = await prisma.project.count({ where: { ...scope, status: { in: [...LIVE_STATUSES] } } });
  const unbilledValue = unbilledTime.reduce((sum, e) => sum + (e.minutes / 60) * toNumber(e.hourlyRate), 0);
  const unbilledHours = unbilledTime.reduce((sum, e) => sum + e.minutes, 0) / 60;
  const outstanding = openInvoices.reduce((sum, i) => sum + (toNumber(i.total) - toNumber(i.amountPaid)), 0);

  return (
    <>
      <PageHeader
        eyebrow={ctx.organization.name}
        title={`Good to see you, ${ctx.userName?.split(" ")[0] ?? "there"}`}
        description="Everything in motion across the studio right now."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Live projects" value={liveCount} sub="Leads through on-hold" />
        <Stat label="Active clients" value={clientCount} />
        <Stat
          label="Unbilled time"
          value={formatMoney(unbilledValue, currency)}
          sub={`${unbilledHours.toFixed(1)} hours ready to invoice`}
        />
        <Stat
          label="Outstanding"
          value={formatMoney(outstanding, currency)}
          sub={`${openInvoices.length} invoice${openInvoices.length === 1 ? "" : "s"} open`}
        />
      </div>

      {awaitingClient > 0 && (
        <div className="mt-4 rounded-xl border border-clay-300 bg-clay-100 px-5 py-3 text-sm text-clay-800">
          {awaitingClient} selection{awaitingClient === 1 ? " is" : "s are"} sitting with clients for approval.
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Current projects"
            description="Sorted by the most recent activity"
            action={
              <Link href="/studio/projects" className="inline-flex items-center gap-1 text-xs text-clay-700 hover:underline">
                All projects <ArrowUpRight className="h-3 w-3" />
              </Link>
            }
          />
          {liveProjects.length === 0 ? (
            <CardBody>
              <EmptyState
                title="No live projects"
                description="Create a client, then start their first project."
              />
            </CardBody>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Project</Th>
                  <Th>Client</Th>
                  <Th>Lead</Th>
                  <Th>Target</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {liveProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-clay-50">
                    <Td>
                      <Link href={`/studio/projects/${project.id}`} className="font-medium text-ink-800 hover:underline">
                        {project.name}
                      </Link>
                    </Td>
                    <Td>
                      <Link href={`/studio/clients/${project.client.id}`} className="text-ink-500 hover:underline">
                        {project.client.name}
                      </Link>
                    </Td>
                    <Td className="text-ink-500">{project.lead?.name ?? "—"}</Td>
                    <Td className="text-ink-500">{formatDate(project.targetDate)}</Td>
                    <Td><StatusBadge status={project.status} kind="project" /></Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Awaiting payment" />
          {openInvoices.length === 0 ? (
            <CardBody>
              <p className="text-sm text-ink-400">Nothing outstanding.</p>
            </CardBody>
          ) : (
            <ul className="divide-y divide-clay-100">
              {openInvoices.map((invoice) => (
                <li key={invoice.id} className="px-5 py-3">
                  <Link href={`/studio/invoices/${invoice.id}`} className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block text-sm font-medium text-ink-800">{invoice.number}</span>
                      <span className="block text-xs text-ink-400">
                        {invoice.client.name} · due {formatDate(invoice.dueDate)}
                      </span>
                    </span>
                    <span className="text-sm text-ink-700">
                      {formatMoney(toNumber(invoice.total) - toNumber(invoice.amountPaid), currency)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
