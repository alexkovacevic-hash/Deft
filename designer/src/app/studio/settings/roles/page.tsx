import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/tenant";
import { PERMISSION_GROUPS, PERMISSIONS } from "@/lib/permissions";
import { RolesPanel } from "./RolesPanel";

export default async function RolesPage() {
  const ctx = await requireStudio("roles.manage");

  const roles = await prisma.role.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: [{ isOwnerRole: "desc" }, { name: "asc" }],
    include: { _count: { select: { memberships: true } } },
  });

  return (
    <RolesPanel
      catalogue={PERMISSIONS}
      groups={PERMISSION_GROUPS}
      roles={roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        isOwnerRole: role.isOwnerRole,
        memberCount: role._count.memberships,
      }))}
    />
  );
}
