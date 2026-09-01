import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePortal } from "@/lib/tenant";
import { formatDate, formatMoney, toNumber } from "@/lib/utils";
import { EmptyState, PageHeader, Stat } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";

const LIVE = ["LEAD", "PROPOSAL", "ACTIVE", "ON_HOLD"];

export default async function PortalHome() {
  const ctx = await requirePortal();
  const clientIds = ctx.access.map((a) => a.clientId);
  const currency = ctx.access[0].currency;

  const projects = await prisma.project.findMany({
    where: { clientId: { in: clientIds }, visibleToClient: true },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      client: { select: { name: true } },
      lead: { select: { name: true } },
      selections: { where: { status: { not: "DRAFT" } }, select: { status: true } },
    },
  });

  const awaiting = projects.reduce(
    (sum, p) => sum + p.selections.filter((s) => s.status === "PROPOSED").length,
    0
  );

  const openInvoices = ctx.access.some((a) => a.canViewInvoices)
    ? await prisma.invoice.findMany({
        where: {
          clientId: { in: ctx.access.filter((a) => a.canViewInvoices).map((a) => a.clientId) },
          status: { in: ["SENT", "PARTIALLY_PAID"] },
        },
        select: { id: true, total: true, amountPaid: true },
      })
    : [];
  const balance = openInvoices.reduce((sum, i) => sum + toNumber(i.total) - toNumber(i.amountPaid), 0);

  const current = projects.filter((p) => LIVE.includes(p.status));
  const finished = projects.filter((p) => !LIVE.includes(p.status));

  function ProjectCards({ rows }: { rows: typeof projects }) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((project) => {
          const proposed = project.selections.filter((s) => s.status === "PROPOSED").length;
          return (
            <Link
              key={project.id}
              href={`/portal/projects/${project.id}`}
              className="group overflow-hidden rounded-xl border border-clay-200 bg-white transition-shadow hover:shadow-md"
            >
              {project.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={project.coverImageUrl} alt="" className="h-32 w-full object-cover" />
              ) : (
                <div className="h-32 w-full bg-gradient-to-br from-clay-200 to-clay-100" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-ink-800 group-hover:underline">{project.name}</h3>
                  <StatusBadge status={project.status} kind="project" />
                </div>
                <p className="mt-1 text-xs text-ink-400">
                  {project.client.name}
                  {project.lead?.name && ` · with ${project.lead.name}`}
                </p>
                <p className="mt-2 text-xs text-ink-500">
                  {project.selections.length} selection{project.selections.length === 1 ? "" : "s"}
                  {proposed > 0 && (
                    <span className="ml-1 font-medium text-clay-700">· {proposed} need your say</span>
                  )}
                </p>
                {project.targetDate && (
                  <p className="mt-1 text-xs text-ink-400">Target {formatDate(project.targetDate)}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={ctx.access[0].organizationName}
        title={`Welcome back, ${ctx.userName?.split(" ")[0] ?? "there"}`}
        description="Your projects, the selections waiting on you, and everything your designer has shared."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Active projects" value={current.length} />
        <Stat label="Awaiting your approval" value={awaiting} />
        {openInvoices.length > 0 && <Stat label="Balance due" value={formatMoney(balance, currency)} />}
      </div>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="display mb-3 text-lg text-ink-900">Current projects</h2>
          {current.length === 0 ? (
            <EmptyState title="Nothing in flight" description="Your designer hasn't opened a project yet." />
          ) : (
            <ProjectCards rows={current} />
          )}
        </section>

        {finished.length > 0 && (
          <section>
            <h2 className="display mb-3 text-lg text-ink-900">Finished projects</h2>
            <ProjectCards rows={finished} />
          </section>
        )}
      </div>
    </>
  );
}
