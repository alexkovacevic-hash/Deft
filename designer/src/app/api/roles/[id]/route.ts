import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, studioGuard } from "@/lib/api";
import { sanitizePermissions } from "@/lib/permissions";

const schema = z.object({
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(300).nullable().optional(),
  permissions: z.array(z.string()).optional(),
});

async function ownedRole(organizationId: string, id: string) {
  const role = await prisma.role.findFirst({ where: { id, organizationId } });
  if (!role) throw new ApiError(404, "Role not found.");
  return role;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await studioGuard("roles.manage");
    const { id } = await params;
    const role = await ownedRole(ctx.organizationId, id);
    const body = schema.parse(await req.json());

    // The owner role always holds every permission — that's what makes it the
    // recovery path if someone mis-configures the others.
    if (role.isOwnerRole && body.permissions) {
      throw new ApiError(409, "The owner role always keeps full access.");
    }

    if (body.name && body.name.trim() !== role.name) {
      const clash = await prisma.role.findFirst({
        where: { organizationId: ctx.organizationId, name: body.name.trim(), id: { not: id } },
        select: { id: true },
      });
      if (clash) throw new ApiError(409, "A role with that name already exists.");
    }

    const updated = await prisma.role.update({
      where: { id },
      data: {
        ...(body.name ? { name: body.name.trim() } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.permissions ? { permissions: sanitizePermissions(body.permissions) } : {}),
      },
    });
    return NextResponse.json({ role: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await studioGuard("roles.manage");
    const { id } = await params;
    const role = await ownedRole(ctx.organizationId, id);
    if (role.isOwnerRole) throw new ApiError(409, "The owner role cannot be deleted.");

    const inUse = await prisma.membership.count({ where: { roleId: id } });
    if (inUse > 0) throw new ApiError(409, "Move the members on this role to another role first.");

    await prisma.role.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
