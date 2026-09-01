import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, studioGuard } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  roleId: z.string().min(1),
  title: z.string().max(120).nullable().optional(),
  hourlyRate: z.number().nonnegative().nullable().optional(),
});

/** Adds a teammate, creating their login with a one-time password if new. */
export async function POST(req: Request) {
  try {
    const ctx = await studioGuard("members.manage");
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    const role = await prisma.role.findFirst({
      where: { id: body.roleId, organizationId: ctx.organizationId },
      select: { id: true },
    });
    if (!role) throw new ApiError(422, "That role belongs to another studio.");

    let user = await prisma.user.findUnique({ where: { email } });
    let oneTimePassword: string | null = null;

    if (!user || !user.hashedPassword) {
      oneTimePassword = randomBytes(9).toString("base64url").slice(0, 12);
      const hashedPassword = await bcrypt.hash(oneTimePassword, 12);
      user = user
        ? await prisma.user.update({ where: { id: user.id }, data: { hashedPassword } })
        : await prisma.user.create({ data: { email, name: body.name.trim(), hashedPassword } });
    }

    const existing = await prisma.membership.findUnique({
      where: { organizationId_userId: { organizationId: ctx.organizationId, userId: user.id } },
      select: { id: true },
    });
    if (existing) throw new ApiError(409, "That person is already on the team.");

    await prisma.membership.create({
      data: {
        organizationId: ctx.organizationId,
        userId: user.id,
        roleId: body.roleId,
        title: body.title ?? null,
        hourlyRate: body.hourlyRate == null ? null : new Prisma.Decimal(body.hourlyRate),
      },
    });

    return NextResponse.json({ ok: true, email, oneTimePassword }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
