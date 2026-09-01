import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { can, projectScope, requireStudio } from "@/lib/tenant";
import { formatDate, formatDuration, formatMoney, toNumber } from "@/lib/utils";
import { Card, CardHeader, PageHeader, Stat } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Table, Td, Th } from "@/components/ui/Table";
import { ShareLinksPanel } from "@/components/ShareLinksPanel";
import { ProjectDialogButton } from "../ProjectDialogButton";
import { SelectionsPanel } from "./SelectionsPanel";
import { TimePanel } from "./TimePanel";

const SOLD = ["APPROVED", "ORDERED", "SHIPPED", "DELIVERED", "INSTALLED"];

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireStudio(["projects.view", "projects.view_assigned"]);
  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, ...projectScope(ctx) },
    include: {
      client: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true, email: true } },
      rooms: { orderBy: { sortOrder: "asc" } },
      selections: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      resources: { orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { issueDate: "desc" } },
      timeEntries: {
        orderBy: { workDate: "desc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!project) notFound();

  const members = await prisma.membership.findMany({
    where: { organizationId: ctx.organizationId, status: "ACTIVE" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const currency = ctx.organization.currency;
  const canSeeAllTime = can(ctx, "time.view_all");
  const timeEntries = project.timeEntries.filter((e) => canSeeAllTime || e.userId === ctx.userId);

  const soldValue = project.selections
    .filter((s) => SOLD.includes(s.status))
    .reduce((sum, s) => sum + s.quantity * toNumber(s.unitPrice), 0);
  const proposedCount = project.selections.filter((s) => s.status === "PROPOSED").length;
  const loggedMinutes = timeEntries.reduce((sum, e) => sum + e.minutes, 0);
  const invoicedTotal = project.invoices
    .filter((i) => i.status !== "DRAFT" && i.status !== "VOID")
    .reduce((sum, i) => sum + toNumber(i.total), 0);

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Link href="/studio/projects" className="hover:underline">Projects</Link>
            <span className="mx-1">/</span>
            <Link href={`/studio/clients/${project.client.id}`} className="hover:underline">
              {project.client.name}
            </Link>
          </>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            {project.name}
            <StatusBadge status={project.status} kind="project" />
          </span>
        }
        description={project.description ?? undefined}
        action={
          can(ctx, "projects.manage") ? (
            <ProjectDialogButton
              variant="outline"
              label="Edit project"
              clients={[{ id: project.client.id, name: project.client.name }]}
              members={members.map((m) => ({ id: m.user.id, name: m.user.name ?? m.user.email }))}
              project={{
                id: project.id,
                clientId: project.clientId,
                name: project.name,
                description: project.description ?? "",
                status: project.status,
                startDate: project.startDate?.toISOString().slice(0, 10) ?? "",
                targetDate: project.targetDate?.toISOString().slice(0, 10) ?? "",
                budget: project.budget ? String(project.budget) : "",
                hourlyRate: project.hourlyRate ? String(project.hourlyRate) : "",
                leadUserId: project.leadUserId ?? "",
                visibleToClient: project.visibleToClient,
              }}
            />
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Budget"
          value={project.budget ? formatMoney(project.budget, currency) : "—"}
          sub={`${formatMoney(soldValue, currency)} in approved items`}
        />
        <Stat
          label="Selections"
          value={project.selections.length}
          sub={proposedCount > 0 ? `${proposedCount} awaiting the client` : "None awaiting the client"}
        />
        <Stat label="Time logged" value={formatDuration(loggedMinutes)} />
        <Stat label="Invoiced" value={formatMoney(invoicedTotal, currency)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 rounded-xl border border-clay-200 bg-white px-5 py-3 text-sm text-ink-600">
        <span>Lead: <strong className="font-medium">{project.lead?.name ?? "Unassigned"}</strong></span>
        <span>Start: {formatDate(project.startDate)}</span>
        <span>Target: {formatDate(project.targetDate)}</span>
        {project.completedAt && <span>Completed: {formatDate(project.completedAt)}</span>}
        <span className={project.visibleToClient ? "text-sage-700" : "text-amber-700"}>
          {project.visibleToClient ? "Visible in the client portal" : "Hidden from the client portal"}
        </span>
      </div>

      <div className="mt-6 space-y-6">
        <SelectionsPanel
          projectId={project.id}
          currency={currency}
          editable={can(ctx, "selections.manage")}
          showCost={can(ctx, "selections.view_cost")}
          rooms={project.rooms.map((r) => ({ id: r.id, name: r.name }))}
          selections={project.selections.map((s) => ({
            id: s.id,
            roomId: s.roomId,
            name: s.name,
            vendor: s.vendor,
            sku: s.sku,
            description: s.description,
            productUrl: s.productUrl,
            imageUrl: s.imageUrl,
            quantity: s.quantity,
            unitCost: s.unitCost ? String(s.unitCost) : null,
            unitPrice: String(s.unitPrice),
            leadTimeWeeks: s.leadTimeWeeks,
            status: s.status,
            designerNote: s.designerNote,
            clientNote: s.clientNote,
          }))}
        />

        <ShareLinksPanel
          projectId={project.id}
          editable={can(ctx, "resources.manage")}
          links={project.resources}
        />

        {can(ctx, "time.log") && (
          <TimePanel
            projectId={project.id}
            currency={currency}
            canLog={can(ctx, "time.log")}
            entries={timeEntries.map((e) => ({
              id: e.id,
              workDate: e.workDate.toISOString(),
              minutes: e.minutes,
              description: e.description,
              hourlyRate: String(e.hourlyRate),
              billable: e.billable,
              invoiced: Boolean(e.invoicedAt),
              userName: e.user.name ?? e.user.email,
              ownedByMe: e.userId === ctx.userId,
            }))}
          />
        )}

        {can(ctx, "invoices.view") && (
          <Card>
            <CardHeader title="Invoices" description="Billing raised against this project" />
            {project.invoices.length === 0 ? (
              <p className="px-5 py-4 text-sm text-ink-400">No invoices yet.</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Number</Th>
                    <Th>Issued</Th>
                    <Th>Total</Th>
                    <Th>Paid</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {project.invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-clay-50">
                      <Td>
                        <Link href={`/studio/invoices/${invoice.id}`} className="font-medium text-ink-800 hover:underline">
                          {invoice.number}
                        </Link>
                      </Td>
                      <Td className="text-ink-500">{formatDate(invoice.issueDate)}</Td>
                      <Td className="text-ink-500">{formatMoney(invoice.total, currency)}</Td>
                      <Td className="text-ink-500">{formatMoney(invoice.amountPaid, currency)}</Td>
                      <Td><StatusBadge status={invoice.status} kind="invoice" /></Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
