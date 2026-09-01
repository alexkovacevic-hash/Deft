import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handleApiError, studioGuard } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2).max(120).optional(),
  logoUrl: z.string().url().or(z.literal("")).nullable().optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  currency: z.string().length(3).optional(),
  defaultHourlyRate: z.number().nonnegative().optional(),
  invoicePrefix: z.string().min(1).max(10).optional(),
  invoiceTerms: z.string().max(5000).nullable().optional(),
  addressLine1: z.string().max(200).nullable().optional(),
  addressLine2: z.string().max(200).nullable().optional(),
  city: z.string().max(120).nullable().optional(),
  state: z.string().max(120).nullable().optional(),
  postalCode: z.string().max(20).nullable().optional(),
  country: z.string().max(120).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  website: z.string().url().or(z.literal("")).nullable().optional(),
});

export async function PATCH(req: Request) {
  try {
    const ctx = await studioGuard("settings.manage");
    const body = schema.parse(await req.json());

    const organization = await prisma.organization.update({
      where: { id: ctx.organizationId },
      data: {
        ...body,
        logoUrl: body.logoUrl === "" ? null : body.logoUrl,
        website: body.website === "" ? null : body.website,
        currency: body.currency?.toUpperCase(),
        ...(body.defaultHourlyRate !== undefined
          ? { defaultHourlyRate: new Prisma.Decimal(body.defaultHourlyRate) }
          : {}),
      },
    });
    return NextResponse.json({ organization });
  } catch (error) {
    return handleApiError(error);
  }
}
