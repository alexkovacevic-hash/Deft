import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/tenant";
import { TeamPanel } from "./TeamPanel";

export default async function TeamPage() {
  const ctx = await requireStudio("members.manage");

  const [members, roles] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        role: { select: { id: true, name: true, isOwnerRole: true } },
      },
    }),
    prisma.role.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <TeamPanel
      currency={ctx.organization.currency}
      currentUserId={ctx.userId}
      roles={roles}
      members={members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        name: m.user.name ?? m.user.email,
        email: m.user.email,
        roleId: m.roleId,
        roleName: m.role.name,
        isOwner: m.role.isOwnerRole,
        title: m.title,
        hourlyRate: m.hourlyRate ? String(m.hourlyRate) : "",
        status: m.status,
      }))}
    />
  );
}
