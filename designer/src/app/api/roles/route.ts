import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, studioGuard } from "@/lib/api";
import { sanitizePermissions } from "@/lib/permissions";

const schema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(300).nullable().optional(),
  permissions: z.array(z.string()),
});

export async function POST(req: Request) {
  try {
    const ctx = await studioGuard("roles.manage");
    const body = schema.parse(await req.json());

    const clash = await prisma.role.findFirst({
      where: { organizationId: ctx.organizationId, name: body.name.trim() },
      select: { id: true },
    });
    if (clash) throw new ApiError(409, "A role with that name already exists.");

    const role = await prisma.role.create({
      data: {
        organizationId: ctx.organizationId,
        name: body.name.trim(),
        description: body.description ?? null,
        permissions: sanitizePermissions(body.permissions),
      },
    });
    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
