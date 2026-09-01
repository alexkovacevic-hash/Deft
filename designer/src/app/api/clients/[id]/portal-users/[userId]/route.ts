import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, studioGuard } from "@/lib/api";

const schema = z.object({
  canApproveSelections: z.boolean().optional(),
  canViewInvoices: z.boolean().optional(),
  canPayInvoices: z.boolean().optional(),
});

async function ownedAccess(organizationId: string, clientId: string, userId: string) {
  const access = await prisma.clientUser.findFirst({
    where: { clientId, userId, client: { organizationId } },
    select: { id: true },
  });
  if (!access) throw new ApiError(404, "Portal access not found.");
  return access;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  try {
    const ctx = await studioGuard("clients.portal");
    const { id, userId } = await params;
    const access = await ownedAccess(ctx.organizationId, id, userId);
    const data = schema.parse(await req.json());
    await prisma.clientUser.update({ where: { id: access.id }, data });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  try {
    const ctx = await studioGuard("clients.portal");
    const { id, userId } = await params;
    const access = await ownedAccess(ctx.organizationId, id, userId);
    await prisma.clientUser.delete({ where: { id: access.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
