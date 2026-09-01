import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, studioGuard } from "@/lib/api";
import { assertProjectAccess } from "@/lib/tenant";

const schema = z
  .object({
    projectId: z.string().nullable().optional(),
    clientId: z.string().nullable().optional(),
    title: z.string().min(1).max(200),
    url: z.string().url(),
    description: z.string().max(2000).nullable().optional(),
    imageUrl: z.string().url().or(z.literal("")).nullable().optional(),
    siteName: z.string().max(160).nullable().optional(),
    category: z.enum(["INSPIRATION", "VENDOR", "DOCUMENT", "MOODBOARD", "OTHER"]).optional(),
    visibleToClient: z.boolean().optional(),
  })
  .refine((v) => Boolean(v.projectId || v.clientId), {
    message: "Attach the link to a project or a client.",
  });

/** Shares a website with a client through the portal. */
export async function POST(req: Request) {
  try {
    const ctx = await studioGuard("resources.manage");
    const body = schema.parse(await req.json());

    if (body.projectId) await assertProjectAccess(ctx, body.projectId);
    if (body.clientId) {
      const client = await prisma.client.findFirst({
        where: { id: body.clientId, organizationId: ctx.organizationId },
        select: { id: true },
      });
      if (!client) throw new ApiError(404, "Client not found.");
    }

    const sortOrder = await prisma.sharedResource.count({
      where: body.projectId ? { projectId: body.projectId } : { clientId: body.clientId! },
    });

    const resource = await prisma.sharedResource.create({
      data: {
        organizationId: ctx.organizationId,
        projectId: body.projectId || null,
        clientId: body.clientId || null,
        title: body.title.trim(),
        url: body.url,
        description: body.description ?? null,
        imageUrl: body.imageUrl || null,
        siteName: body.siteName ?? null,
        category: body.category ?? "INSPIRATION",
        visibleToClient: body.visibleToClient ?? true,
        createdById: ctx.userId,
        sortOrder,
      },
    });
    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
