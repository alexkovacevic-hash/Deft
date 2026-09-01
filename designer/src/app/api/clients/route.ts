import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError, studioGuard } from "@/lib/api";

const clientSchema = z.object({
  name: z.string().min(1).max(160),
  contactName: z.string().max(160).optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  phone: z.string().max(40).optional().nullable(),
  addressLine1: z.string().max(200).optional().nullable(),
  addressLine2: z.string().max(200).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  state: z.string().max(120).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  country: z.string().max(120).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export async function GET() {
  try {
    const ctx = await studioGuard("clients.view");
    const clients = await prisma.client.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { name: "asc" },
      include: { _count: { select: { projects: true } } },
    });
    return NextResponse.json({ clients });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await studioGuard("clients.manage");
    const data = clientSchema.parse(await req.json());
    const client = await prisma.client.create({
      data: {
        ...data,
        email: data.email || null,
        organizationId: ctx.organizationId,
      },
    });
    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
