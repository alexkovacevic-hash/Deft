import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, studioGuard } from "@/lib/api";

const schema = z.object({
  roleId: z.string().optional(),
  title: z.string().max(120).nullable().optional(),
  hourlyRate: z.number().nonnegative().nullable().optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

async function ownedMembership(organizationId: string, id: string) {
  const membership = await prisma.membership.findFirst({
    where: { id, organizationId },
    include: { role: { select: { isOwnerRole: true } } },
  });
  if (!membership) throw new ApiError(404, "Team member not found.");
  return membership;
}

/** Refuses a change that would leave the studio without an active owner. */
async function assertOwnerRemains(organizationId: string, membershipId: string) {
  const owners = await prisma.membership.count({
    where: { organizationId, status: "ACTIVE", role: { isOwnerRole: true }, id: { not: membershipId } },
  });
  if (owners === 0) throw new ApiError(409, "The studio must keep at least one active owner.");
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await studioGuard("members.manage");
    const { id } = await params;
    const membership = await ownedMembership(ctx.organizationId, id);
    const body = schema.parse(await req.json());

    if (body.roleId && body.roleId !== membership.roleId) {
      const role = await prisma.role.findFirst({
        where: { id: body.roleId, organizationId: ctx.organizationId },
        select: { id: true, isOwnerRole: true },
      });
      if (!role) throw new ApiError(422, "That role belongs to another studio.");
      if (membership.role.isOwnerRole && !role.isOwnerRole) {
        await assertOwnerRemains(ctx.organizationId, id);
      }
    }
    if (body.status === "DISABLED" && membership.role.isOwnerRole) {
      await assertOwnerRemains(ctx.organizationId, id);
    }

    const updated = await prisma.membership.update({
      where: { id },
      data: {
        ...(body.roleId ? { roleId: body.roleId } : {}),
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.status ? { status: body.status } : {}),
        ...(body.hourlyRate !== undefined
          ? { hourlyRate: body.hourlyRate == null ? null : new Prisma.Decimal(body.hourlyRate) }
          : {}),
      },
    });
    return NextResponse.json({ membership: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await studioGuard("members.manage");
    const { id } = await params;
    const membership = await ownedMembership(ctx.organizationId, id);
    if (membership.role.isOwnerRole) await assertOwnerRemains(ctx.organizationId, id);

    // Keep their history: projects they led simply lose the lead pointer.
    await prisma.$transaction([
      prisma.project.updateMany({
        where: { organizationId: ctx.organizationId, leadUserId: membership.userId },
        data: { leadUserId: null },
      }),
      prisma.membership.delete({ where: { id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
