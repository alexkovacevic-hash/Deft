import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, studioGuard } from "@/lib/api";
import { nextInvoiceNumber, recalcInvoice } from "@/lib/billing";

const schema = z.object({
  clientId: z.string().min(1),
  projectId: z.string().nullable().optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  terms: z.string().max(5000).nullable().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).optional(),
});

export async function POST(req: Request) {
  try {
    const ctx = await studioGuard("invoices.manage");
    const body = schema.parse(await req.json());

    const client = await prisma.client.findFirst({
      where: { id: body.clientId, organizationId: ctx.organizationId },
      select: { id: true },
    });
    if (!client) throw new ApiError(404, "Client not found.");

    if (body.projectId) {
      const project = await prisma.project.findFirst({
        where: { id: body.projectId, organizationId: ctx.organizationId, clientId: body.clientId },
        select: { id: true },
      });
      if (!project) throw new ApiError(422, "That project does not belong to this client.");
    }

    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: { invoicePrefix: true, invoiceTerms: true },
    });

    const invoice = await prisma.invoice.create({
      data: {
        organizationId: ctx.organizationId,
        clientId: body.clientId,
        projectId: body.projectId || null,
        number: await nextInvoiceNumber(ctx.organizationId, org.invoicePrefix),
        issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        notes: body.notes ?? null,
        terms: body.terms ?? org.invoiceTerms ?? null,
        taxRate: new Prisma.Decimal(body.taxRate ?? 0),
        discount: new Prisma.Decimal(body.discount ?? 0),
      },
    });
    await recalcInvoice(invoice.id);

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
