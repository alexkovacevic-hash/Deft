import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { can, projectScope, requireStudio } from "@/lib/tenant";
import { formatDate, formatDuration, formatMoney, toNumber } from "@/lib/utils";
import { Card, CardHeader, PageHeader, Stat } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, Td, Th } from "@/components/ui/Table";
import { LogTimeForm } from "./LogTimeForm";

export default async function TimePage() {
  const ctx = await requireStudio("time.log");
  const seesAll = can(ctx, "time.view_all");

  const [entries, projects] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { organizationId: ctx.organizationId, ...(seesAll ? {} : { userId: ctx.userId }) },
      orderBy: { workDate: "desc" },
      take: 150,
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, client: { select: { id: true, name: true } } } },
      },
    }),
    prisma.project.findMany({
      where: { ...projectScope(ctx), status: { in: ["LEAD", "PROPOSAL", "ACTIVE", "ON_HOLD"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, client: { select: { name: true } } },
    }),
  ]);

  const currency = ctx.organization.currency;
  const totalMinutes = entries.reduce((sum, e) => sum + e.minutes, 0);
  const unbilled = entries.filter((e) => e.billable && !e.invoicedAt);
  const unbilledValue = unbilled.reduce((sum, e) => sum + (e.minutes / 60) * toNumber(e.hourlyRate), 0);

  return (
    <>
      <PageHeader
        title="Time"
        description={seesAll ? "Everyone's hours across the studio." : "The hours you've logged."}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Logged" value={formatDuration(totalMinutes)} sub="Most recent 150 entries" />
        <Stat label="Unbilled" value={formatDuration(unbilled.reduce((s, e) => s + e.minutes, 0))} />
        <Stat label="Unbilled value" value={formatMoney(unbilledValue, currency)} />
      </div>

      <div className="mt-6 space-y-6">
        <LogTimeForm
          projects={projects.map((p) => ({ id: p.id, label: `${p.client.name} — ${p.name}` }))}
        />

        <Card>
          <CardHeader title="Entries" />
          {entries.length === 0 ? (
            <p className="px-5 py-4 text-sm text-ink-400">Nothing logged yet.</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Project</Th>
                  {seesAll && <Th>Who</Th>}
                  <Th>Description</Th>
                  <Th>Time</Th>
                  <Th>Value</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-clay-50">
                    <Td className="whitespace-nowrap text-ink-500">{formatDate(entry.workDate)}</Td>
                    <Td>
                      <Link href={`/studio/projects/${entry.project.id}`} className="text-ink-700 hover:underline">
                        {entry.project.name}
                      </Link>
                      <span className="block text-xs text-ink-400">{entry.project.client.name}</span>
                    </Td>
                    {seesAll && <Td className="text-ink-500">{entry.user.name ?? entry.user.email}</Td>}
                    <Td>{entry.description}</Td>
                    <Td className="whitespace-nowrap">{formatDuration(entry.minutes)}</Td>
                    <Td className="whitespace-nowrap text-ink-500">
                      {formatMoney((entry.minutes / 60) * toNumber(entry.hourlyRate), currency)}
                    </Td>
                    <Td>
                      {!entry.billable && <Badge tone="neutral">Non-billable</Badge>}
                      {entry.invoicedAt && <Badge tone="green">Invoiced</Badge>}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
