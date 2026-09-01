import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, studioGuard } from "@/lib/api";

const updateSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  contactName: z.string().max(160).nullable().optional(),
  email: z.string().email().or(z.literal("")).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  addressLine1: z.string().max(200).nullable().optional(),
  addressLine2: z.string().max(200).nullable().optional(),
  city: z.string().max(120).nullable().optional(),
  state: z.string().max(120).nullable().optional(),
  postalCode: z.string().max(20).nullable().optional(),
  country: z.string().max(120).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

async function ownedClient(organizationId: string, id: string) {
  const client = await prisma.client.findFirst({ where: { id, organizationId }, select: { id: true } });
  if (!client) throw new ApiError(404, "Client not found.");
  return client;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await studioGuard("clients.manage");
    const { id } = await params;
    await ownedClient(ctx.organizationId, id);

    const data = updateSchema.parse(await req.json());
    const client = await prisma.client.update({
      where: { id },
      data: { ...data, email: data.email === "" ? null : data.email },
    });
    return NextResponse.json({ client });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await studioGuard("clients.manage");
    const { id } = await params;
    await ownedClient(ctx.organizationId, id);

    const invoiceCount = await prisma.invoice.count({ where: { clientId: id } });
    if (invoiceCount > 0) {
      throw new ApiError(409, "This client has invoices. Archive them instead of deleting.");
    }
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
