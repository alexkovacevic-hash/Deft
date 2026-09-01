import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, studioGuard } from "@/lib/api";

const schema = z.object({
  title: z.string().min(1).max(200).optional(),
  url: z.string().url().optional(),
  description: z.string().max(2000).nullable().optional(),
  imageUrl: z.string().url().or(z.literal("")).nullable().optional(),
  category: z.enum(["INSPIRATION", "VENDOR", "DOCUMENT", "MOODBOARD", "OTHER"]).optional(),
  visibleToClient: z.boolean().optional(),
});

async function owned(organizationId: string, id: string) {
  const resource = await prisma.sharedResource.findFirst({
    where: { id, organizationId },
    select: { id: true },
  });
  if (!resource) throw new ApiError(404, "Link not found.");
  return resource;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await studioGuard("resources.manage");
    const { id } = await params;
    await owned(ctx.organizationId, id);
    const body = schema.parse(await req.json());
    const resource = await prisma.sharedResource.update({
      where: { id },
      data: { ...body, imageUrl: body.imageUrl === "" ? null : body.imageUrl },
    });
    return NextResponse.json({ resource });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await studioGuard("resources.manage");
    const { id } = await params;
    await owned(ctx.organizationId, id);
    await prisma.sharedResource.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
