import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, studioGuard } from "@/lib/api";
import { assertProjectAccess, can } from "@/lib/tenant";
import { toNumber } from "@/lib/utils";

const schema = z.object({
  projectId: z.string().min(1),
  userId: z.string().optional(),
  workDate: z.string().min(1),
  minutes: z.number().int().min(1).max(24 * 60),
  description: z.string().min(1).max(1000),
  hourlyRate: z.number().nonnegative().optional(),
  billable: z.boolean().optional(),
});

/** Rate precedence: explicit override, then project, then member, then studio. */
async function resolveRate(
  organizationId: string,
  projectId: string,
  userId: string,
  override?: number
): Promise<Prisma.Decimal> {
  if (override != null) return new Prisma.Decimal(override);

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { hourlyRate: true } });
  if (project?.hourlyRate) return project.hourlyRate;

  const membership = await prisma.membership.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
    select: { hourlyRate: true },
  });
  if (membership?.hourlyRate) return membership.hourlyRate;

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { defaultHourlyRate: true },
  });
  return org?.defaultHourlyRate ?? new Prisma.Decimal(0);
}

export async function POST(req: Request) {
  try {
    const ctx = await studioGuard("time.log");
    const body = schema.parse(await req.json());
    await assertProjectAccess(ctx, body.projectId);

    // Logging time for someone else needs the wider permission.
    const targetUserId = body.userId && body.userId !== ctx.userId ? body.userId : ctx.userId;
    if (targetUserId !== ctx.userId && !can(ctx, "time.manage_all")) {
      throw new ApiError(403, "You may only log your own time.");
    }
    if (targetUserId !== ctx.userId) {
      const member = await prisma.membership.findFirst({
        where: { organizationId: ctx.organizationId, userId: targetUserId },
        select: { id: true },
      });
      if (!member) throw new ApiError(422, "That person is not a member of this studio.");
    }

    const entry = await prisma.timeEntry.create({
      data: {
        organizationId: ctx.organizationId,
        projectId: body.projectId,
        userId: targetUserId,
        workDate: new Date(body.workDate),
        minutes: body.minutes,
        description: body.description.trim(),
        hourlyRate: await resolveRate(ctx.organizationId, body.projectId, targetUserId, body.hourlyRate),
        billable: body.billable ?? true,
      },
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: Request) {
  try {
    const ctx = await studioGuard("time.log");
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId") ?? undefined;

    const where: Prisma.TimeEntryWhereInput = { organizationId: ctx.organizationId };
    if (projectId) where.projectId = projectId;
    if (!can(ctx, "time.view_all")) where.userId = ctx.userId;

    const entries = await prisma.timeEntry.findMany({
      where,
      orderBy: { workDate: "desc" },
      take: 200,
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    const totalMinutes = entries.reduce((sum, e) => sum + e.minutes, 0);
    const billableValue = entries
      .filter((e) => e.billable)
      .reduce((sum, e) => sum + (e.minutes / 60) * toNumber(e.hourlyRate), 0);

    return NextResponse.json({ entries, totalMinutes, billableValue });
  } catch (error) {
    return handleApiError(error);
  }
}
