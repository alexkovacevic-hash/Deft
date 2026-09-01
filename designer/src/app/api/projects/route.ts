import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, studioGuard } from "@/lib/api";
import { projectScope } from "@/lib/tenant";

const schema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(1).max(160),
  description: z.string().max(5000).nullable().optional(),
  status: z.enum(["LEAD", "PROPOSAL", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]).optional(),
  startDate: z.string().nullable().optional(),
  targetDate: z.string().nullable().optional(),
  budget: z.number().nonnegative().nullable().optional(),
  hourlyRate: z.number().nonnegative().nullable().optional(),
  leadUserId: z.string().nullable().optional(),
  coverImageUrl: z.string().url().or(z.literal("")).nullable().optional(),
  visibleToClient: z.boolean().optional(),
});

export async function GET() {
  try {
    const ctx = await studioGuard(["projects.view", "projects.view_assigned"]);
    const projects = await prisma.project.findMany({
      where: projectScope(ctx),
      orderBy: { updatedAt: "desc" },
      include: { client: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ projects });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await studioGuard("projects.manage");
    const body = schema.parse(await req.json());

    const client = await prisma.client.findFirst({
      where: { id: body.clientId, organizationId: ctx.organizationId },
      select: { id: true },
    });
    if (!client) throw new ApiError(404, "Client not found.");

    if (body.leadUserId) {
      const lead = await prisma.membership.findFirst({
        where: { organizationId: ctx.organizationId, userId: body.leadUserId },
        select: { id: true },
      });
      if (!lead) throw new ApiError(422, "The chosen lead is not a member of this studio.");
    }

    const project = await prisma.project.create({
      data: {
        organizationId: ctx.organizationId,
        clientId: body.clientId,
        name: body.name.trim(),
        description: body.description ?? null,
        status: body.status ?? "ACTIVE",
        startDate: body.startDate ? new Date(body.startDate) : null,
        targetDate: body.targetDate ? new Date(body.targetDate) : null,
        budget: body.budget == null ? null : new Prisma.Decimal(body.budget),
        hourlyRate: body.hourlyRate == null ? null : new Prisma.Decimal(body.hourlyRate),
        leadUserId: body.leadUserId || null,
        coverImageUrl: body.coverImageUrl || null,
        visibleToClient: body.visibleToClient ?? true,
      },
    });
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
