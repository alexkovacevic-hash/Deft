import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError } from "@/lib/api";
import { getPortalContext, getStudioContext } from "@/lib/tenant";
import { amountDue } from "@/lib/billing";
import { appUrl, getStripe, stripeConfigured } from "@/lib/stripe";

/**
 * Opens a Stripe Checkout session for the balance due. Reachable by a client
 * with portal payment rights, or by studio staff generating a payment link.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!stripeConfigured()) throw new ApiError(503, "Online payments are not configured for this studio.");
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true, currency: true } },
      },
    });
    if (!invoice) throw new ApiError(404, "Invoice not found.");

    // Either a member of the owning studio, or a portal user of the client.
    const studio = await getStudioContext();
    const portal = await getPortalContext();
    const isStaff = studio?.organizationId === invoice.organizationId;
    const isClient = portal?.access.some((a) => a.clientId === invoice.clientId && a.canPayInvoices) ?? false;
    if (!isStaff && !isClient) throw new ApiError(403, "You cannot pay this invoice.");

    if (invoice.status === "VOID") throw new ApiError(409, "This invoice is void.");
    if (invoice.status === "DRAFT") throw new ApiError(409, "This invoice has not been sent yet.");

    const due = amountDue(invoice);
    if (due <= 0) throw new ApiError(409, "This invoice is already paid in full.");

    const base = appUrl();
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: invoice.client.email ?? undefined,
      client_reference_id: invoice.id,
      metadata: { invoiceId: invoice.id, organizationId: invoice.organizationId },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: invoice.organization.currency.toLowerCase(),
            unit_amount: Math.round(due * 100),
            product_data: {
              name: `Invoice ${invoice.number} — ${invoice.organization.name}`,
              description: `Balance due for ${invoice.client.name}`,
            },
          },
        },
      ],
      success_url: `${base}/portal/invoices/${invoice.id}?paid=1`,
      cancel_url: `${base}/portal/invoices/${invoice.id}`,
    });

    await prisma.invoice.update({ where: { id }, data: { stripeSessionId: session.id } });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    return handleApiError(error);
  }
}
