import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { can, requireStudio } from "@/lib/tenant";
import { formatDate } from "@/lib/utils";
import { Card, EmptyState, PageHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, Td, Th } from "@/components/ui/Table";
import { ClientDialogButton } from "./ClientDialogButton";

const LIVE = ["LEAD", "PROPOSAL", "ACTIVE", "ON_HOLD"];

export default async function ClientsPage() {
  const ctx = await requireStudio("clients.view");
  const editable = can(ctx, "clients.manage");

  const clients = await prisma.client.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: {
      projects: { select: { id: true, status: true, updatedAt: true } },
      _count: { select: { portalUsers: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Clients"
        description="Every household and company the studio works with."
        action={editable ? <ClientDialogButton /> : undefined}
      />

      {clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          description="Add your first client, then start a project for them."
          action={editable ? <ClientDialogButton /> : undefined}
        />
      ) : (
        <Card>
          <Table>
            <thead>
              <tr>
                <Th>Client</Th>
                <Th>Contact</Th>
                <Th>Projects</Th>
                <Th>Portal</Th>
                <Th>Last activity</Th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const live = client.projects.filter((p) => LIVE.includes(p.status)).length;
                const finished = client.projects.length - live;
                const lastTouch = client.projects
                  .map((p) => p.updatedAt)
                  .sort((a, b) => b.getTime() - a.getTime())[0];

                return (
                  <tr key={client.id} className="hover:bg-clay-50">
                    <Td>
                      <Link href={`/studio/clients/${client.id}`} className="font-medium text-ink-800 hover:underline">
                        {client.name}
                      </Link>
                      {client.status === "ARCHIVED" && (
                        <Badge className="ml-2" tone="neutral">Archived</Badge>
                      )}
                    </Td>
                    <Td className="text-ink-500">
                      {client.contactName ?? "—"}
                      {client.email && <span className="block text-xs text-ink-400">{client.email}</span>}
                    </Td>
                    <Td className="text-ink-500">
                      {live} current
                      {finished > 0 && <span className="text-ink-300"> · {finished} finished</span>}
                    </Td>
                    <Td>
                      {client._count.portalUsers > 0 ? (
                        <Badge tone="green">{client._count.portalUsers} login{client._count.portalUsers === 1 ? "" : "s"}</Badge>
                      ) : (
                        <span className="text-xs text-ink-300">Not invited</span>
                      )}
                    </Td>
                    <Td className="text-ink-500">{formatDate(lastTouch ?? client.updatedAt)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  );
}
