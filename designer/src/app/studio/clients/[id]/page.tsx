import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { can, requireStudio } from "@/lib/tenant";
import { formatDate, formatMoney, toNumber } from "@/lib/utils";
import { Card, CardBody, CardHeader, PageHeader, Stat } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Table, Td, Th } from "@/components/ui/Table";
import { ShareLinksPanel } from "@/components/ShareLinksPanel";
import { ClientDialogButton } from "../ClientDialogButton";
import { ProjectDialogButton } from "../../projects/ProjectDialogButton";
import { PortalAccessPanel } from "./PortalAccessPanel";

const LIVE = ["LEAD", "PROPOSAL", "ACTIVE", "ON_HOLD"];

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireStudio("clients.view");
  const { id } = await params;

  const client = await prisma.client.findFirst({
    where: { id, organizationId: ctx.organizationId },
    include: {
      projects: {
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        include: {
          lead: { select: { name: true } },
          _count: { select: { selections: true } },
        },
      },
      portalUsers: { include: { user: { select: { id: true, name: true, email: true } } } },
      resources: { where: { projectId: null }, orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { issueDate: "desc" } },
    },
  });
  if (!client) notFound();

  const members = await prisma.membership.findMany({
    where: { organizationId: ctx.organizationId, status: "ACTIVE" },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  // Bound before the inner table component so its row type isn't the nullable query type.
  const allProjects = client.projects;
  const current = allProjects.filter((p) => LIVE.includes(p.status));
  const finished = allProjects.filter((p) => !LIVE.includes(p.status));
  const currency = ctx.organization.currency;

  const invoiced = client.invoices
    .filter((i) => i.status !== "DRAFT" && i.status !== "VOID")
    .reduce((sum, i) => sum + toNumber(i.total), 0);
  const outstanding = client.invoices
    .filter((i) => i.status === "SENT" || i.status === "PARTIALLY_PAID")
    .reduce((sum, i) => sum + toNumber(i.total) - toNumber(i.amountPaid), 0);

  const address = [client.addressLine1, client.city, client.state, client.postalCode]
    .filter(Boolean)
    .join(", ");

  function ProjectTable({ rows }: { rows: typeof allProjects }) {
    return (
      <Table>
        <thead>
          <tr>
            <Th>Project</Th>
            <Th>Lead</Th>
            <Th>Selections</Th>
            <Th>Budget</Th>
            <Th>Dates</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((project) => (
            <tr key={project.id} className="hover:bg-clay-50">
              <Td>
                <Link href={`/studio/projects/${project.id}`} className="font-medium text-ink-800 hover:underline">
                  {project.name}
                </Link>
              </Td>
              <Td className="text-ink-500">{project.lead?.name ?? "—"}</Td>
              <Td className="text-ink-500">{project._count.selections}</Td>
              <Td className="text-ink-500">{project.budget ? formatMoney(project.budget, currency) : "—"}</Td>
              <Td className="text-ink-500">
                {formatDate(project.startDate)}
                <span className="text-ink-300"> → </span>
                {formatDate(project.completedAt ?? project.targetDate)}
              </Td>
              <Td><StatusBadge status={project.status} kind="project" /></Td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/studio/clients" className="hover:underline">Clients</Link>}
        title={client.name}
        description={client.contactName ?? undefined}
        action={
          <>
            {can(ctx, "clients.manage") && (
              <ClientDialogButton
                variant="outline"
                label="Edit client"
                client={{
                  id: client.id,
                  name: client.name,
                  contactName: client.contactName ?? "",
                  email: client.email ?? "",
                  phone: client.phone ?? "",
                  addressLine1: client.addressLine1 ?? "",
                  city: client.city ?? "",
                  state: client.state ?? "",
                  postalCode: client.postalCode ?? "",
                  notes: client.notes ?? "",
                }}
              />
            )}
            {can(ctx, "projects.manage") && (
              <ProjectDialogButton
                clients={[{ id: client.id, name: client.name }]}
                defaultClientId={client.id}
                members={members.map((m) => ({ id: m.user.id, name: m.user.name ?? m.user.email }))}
              />
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Current projects" value={current.length} />
        <Stat label="Finished projects" value={finished.length} />
        {can(ctx, "invoices.view") && <Stat label="Invoiced to date" value={formatMoney(invoiced, currency)} />}
        {can(ctx, "invoices.view") && (
          <Stat label="Outstanding" value={formatMoney(outstanding, currency)} />
        )}
      </div>

      {(client.email || client.phone || address) && (
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-clay-200 bg-white px-5 py-3 text-sm text-ink-600">
          {client.email && (
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-ink-300" />
              <a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a>
            </span>
          )}
          {client.phone && (
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-ink-300" /> {client.phone}
            </span>
          )}
          {address && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-ink-300" /> {address}
            </span>
          )}
        </div>
      )}

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader title="Current projects" description="Leads, proposals, active work and anything on hold" />
          {current.length === 0 ? (
            <CardBody><p className="text-sm text-ink-400">Nothing in flight for this client.</p></CardBody>
          ) : (
            <ProjectTable rows={current} />
          )}
        </Card>

        <Card>
          <CardHeader title="Finished projects" description="Completed and archived work" />
          {finished.length === 0 ? (
            <CardBody><p className="text-sm text-ink-400">No finished projects yet.</p></CardBody>
          ) : (
            <ProjectTable rows={finished} />
          )}
        </Card>

        {can(ctx, "invoices.view") && client.invoices.length > 0 && (
          <Card>
            <CardHeader title="Invoices" />
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
                {client.invoices.map((invoice) => (
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
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <PortalAccessPanel
            clientId={client.id}
            editable={can(ctx, "clients.portal")}
            users={client.portalUsers.map((pu) => ({
              userId: pu.user.id,
              name: pu.user.name,
              email: pu.user.email,
              canApproveSelections: pu.canApproveSelections,
              canViewInvoices: pu.canViewInvoices,
              canPayInvoices: pu.canPayInvoices,
            }))}
          />
          <ShareLinksPanel
            clientId={client.id}
            editable={can(ctx, "resources.manage")}
            title="Links for this client"
            description="Shown across every project in their portal"
            links={client.resources}
          />
        </div>

        {client.notes && (
          <Card>
            <CardHeader title="Notes" />
            <CardBody>
              <p className="whitespace-pre-wrap text-sm text-ink-600">{client.notes}</p>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
