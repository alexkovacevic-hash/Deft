import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, studioGuard } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  canApproveSelections: z.boolean().optional(),
  canViewInvoices: z.boolean().optional(),
  canPayInvoices: z.boolean().optional(),
});

/** Generates a readable one-time password the designer can pass to the client. */
function temporaryPassword(): string {
  return randomBytes(9).toString("base64url").slice(0, 12);
}

/**
 * Grants a person portal access to this client. Creates the login if the email
 * is new, and returns a one-time password to hand over (shown once).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await studioGuard("clients.portal");
    const { id } = await params;

    const client = await prisma.client.findFirst({
      where: { id, organizationId: ctx.organizationId },
      select: { id: true },
    });
    if (!client) throw new ApiError(404, "Client not found.");

    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    let user = await prisma.user.findUnique({ where: { email } });
    let oneTimePassword: string | null = null;

    if (!user) {
      oneTimePassword = temporaryPassword();
      user = await prisma.user.create({
        data: {
          email,
          name: body.name.trim(),
          hashedPassword: await bcrypt.hash(oneTimePassword, 12),
        },
      });
    } else if (!user.hashedPassword) {
      oneTimePassword = temporaryPassword();
      user = await prisma.user.update({
        where: { id: user.id },
        data: { hashedPassword: await bcrypt.hash(oneTimePassword, 12) },
      });
    }

    const existing = await prisma.clientUser.findUnique({
      where: { clientId_userId: { clientId: id, userId: user.id } },
      select: { id: true },
    });
    if (existing) throw new ApiError(409, "That person already has access to this client.");

    await prisma.clientUser.create({
      data: {
        clientId: id,
        userId: user.id,
        canApproveSelections: body.canApproveSelections ?? true,
        canViewInvoices: body.canViewInvoices ?? true,
        canPayInvoices: body.canPayInvoices ?? true,
      },
    });

    return NextResponse.json({ ok: true, email, oneTimePassword }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
