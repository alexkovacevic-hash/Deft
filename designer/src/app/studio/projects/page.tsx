import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { can, projectScope, requireStudio } from "@/lib/tenant";
import { formatDate, formatMoney } from "@/lib/utils";
import { Card, EmptyState, PageHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Table, Td, Th } from "@/components/ui/Table";
import { ProjectDialogButton } from "./ProjectDialogButton";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "current", label: "Current", statuses: ["LEAD", "PROPOSAL", "ACTIVE", "ON_HOLD"] },
  { key: "completed", label: "Finished", statuses: ["COMPLETED", "ARCHIVED"] },
  { key: "all", label: "All", statuses: [] },
];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const ctx = await requireStudio(["projects.view", "projects.view_assigned"]);
  const { filter } = await searchParams;
  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];

  const [projects, clients, members] = await Promise.all([
    prisma.project.findMany({
      where: {
        ...projectScope(ctx),
        ...(active.statuses.length ? { status: { in: active.statuses as never } } : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        lead: { select: { name: true } },
        _count: { select: { selections: true } },
      },
    }),
    can(ctx, "clients.view")
      ? prisma.client.findMany({
          where: { organizationId: ctx.organizationId, status: "ACTIVE" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    prisma.membership.findMany({
      where: { organizationId: ctx.organizationId, status: "ACTIVE" },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Projects"
        description="Everything the studio is working on, and everything it has finished."
        action={
          can(ctx, "projects.manage") ? (
            <ProjectDialogButton
              clients={clients}
              members={members.map((m) => ({ id: m.user.id, name: m.user.name ?? m.user.email }))}
            />
          ) : undefined
        }
      />

      <div className="mb-4 flex gap-1">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/studio/projects?filter=${f.key}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              f.key === active.key ? "bg-ink-800 text-white" : "text-ink-500 hover:bg-clay-100"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title={`No ${active.label.toLowerCase()} projects`}
          description="Projects you create will show up here."
        />
      ) : (
        <Card>
          <Table>
            <thead>
              <tr>
                <Th>Project</Th>
                <Th>Client</Th>
                <Th>Lead</Th>
                <Th>Selections</Th>
                <Th>Budget</Th>
                <Th>Target</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
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
                  <Td className="text-ink-500">{project._count.selections}</Td>
                  <Td className="text-ink-500">
                    {project.budget ? formatMoney(project.budget, ctx.organization.currency) : "—"}
                  </Td>
                  <Td className="text-ink-500">{formatDate(project.targetDate)}</Td>
                  <Td><StatusBadge status={project.status} kind="project" /></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  );
}
