import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePortal } from "@/lib/tenant";
import { formatDate, formatMoney, toNumber } from "@/lib/utils";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader, PageHeader, Stat } from "@/components/ui/Card";
import { SelectionCard } from "./SelectionCard";

const APPROVED = ["APPROVED", "ORDERED", "SHIPPED", "DELIVERED", "INSTALLED"];

export default async function PortalProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePortal();
  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: {
      id,
      visibleToClient: true,
      clientId: { in: ctx.access.map((a) => a.clientId) },
    },
    include: {
      client: { select: { id: true, name: true } },
      lead: { select: { name: true } },
      rooms: { orderBy: { sortOrder: "asc" } },
      // Drafts stay with the designer until they're proposed.
      selections: {
        where: { status: { not: "DRAFT" } },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      resources: { where: { visibleToClient: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) notFound();

  // Links pinned to the client as a whole show on every one of their projects.
  const clientResources = await prisma.sharedResource.findMany({
    where: { clientId: project.clientId, projectId: null, visibleToClient: true },
    orderBy: { createdAt: "desc" },
  });

  const access = ctx.access.find((a) => a.clientId === project.clientId)!;
  const currency = access.currency;
  const links = [...project.resources, ...clientResources];

  const awaiting = project.selections.filter((s) => s.status === "PROPOSED");
  const approvedValue = project.selections
    .filter((s) => APPROVED.includes(s.status))
    .reduce((sum, s) => sum + s.quantity * toNumber(s.unitPrice), 0);

  const groups = [
    ...project.rooms.map((room) => ({
      key: room.id,
      name: room.name,
      items: project.selections.filter((s) => s.roomId === room.id),
    })),
    { key: "other", name: "Everything else", items: project.selections.filter((s) => !s.roomId) },
  ].filter((g) => g.items.length > 0);

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/portal" className="hover:underline">Projects</Link>}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {project.name}
            <StatusBadge status={project.status} kind="project" />
          </span>
        }
        description={project.description ?? undefined}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Awaiting your approval" value={awaiting.length} />
        <Stat label="Approved so far" value={formatMoney(approvedValue, currency)} />
        <Stat
          label="Target date"
          value={formatDate(project.targetDate)}
          sub={project.lead?.name ? `With ${project.lead.name}` : undefined}
        />
      </div>

      {links.length > 0 && (
        <Card className="mt-6">
          <CardHeader title="Shared with you" description="Websites and references from your designer" />
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-3 rounded-lg border border-clay-100 p-3 transition-colors hover:border-clay-300"
                >
                  {link.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={link.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-md object-cover" />
                  )}
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink-800 group-hover:underline">
                      {link.title}
                      <ExternalLink className="ml-1 inline h-3 w-3 text-ink-300" />
                    </span>
                    {link.description && (
                      <span className="mt-0.5 line-clamp-2 block text-xs text-ink-400">{link.description}</span>
                    )}
                    <Badge className="mt-1.5" tone="clay">
                      {link.category.charAt(0) + link.category.slice(1).toLowerCase()}
                    </Badge>
                  </span>
                </a>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <section className="mt-8">
        <h2 className="display mb-3 text-lg text-ink-900">Selections</h2>
        {groups.length === 0 ? (
          <p className="rounded-xl border border-dashed border-clay-300 bg-white/60 px-6 py-10 text-center text-sm text-ink-400">
            Nothing to review yet. Your designer will share selections here.
          </p>
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <div key={group.key}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">{group.name}</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((selection) => (
                    <SelectionCard
                      key={selection.id}
                      currency={currency}
                      canApprove={access.canApproveSelections}
                      selection={{
                        id: selection.id,
                        name: selection.name,
                        vendor: selection.vendor,
                        description: selection.description,
                        productUrl: selection.productUrl,
                        imageUrl: selection.imageUrl,
                        quantity: selection.quantity,
                        unitPrice: String(selection.unitPrice),
                        leadTimeWeeks: selection.leadTimeWeeks,
                        status: selection.status,
                        clientNote: selection.clientNote,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
