import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { recalcInvoice } from "@/lib/billing";

export const runtime = "nodejs";

/** Records portal payments once Stripe confirms them. */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 400 });
  }

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error("Stripe signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const invoiceId = session.metadata?.invoiceId ?? session.client_reference_id;
    const amount = (session.amount_total ?? 0) / 100;

    if (invoiceId && amount > 0) {
      const reference = session.payment_intent?.toString() ?? session.id;
      // Stripe retries webhooks; the reference keeps this idempotent.
      const existing = await prisma.payment.findFirst({ where: { invoiceId, reference } });
      if (!existing) {
        await prisma.payment.create({
          data: {
            invoiceId,
            amount: new Prisma.Decimal(amount),
            method: "STRIPE",
            reference,
            paidAt: new Date(),
          },
        });
        await recalcInvoice(invoiceId);
      }
    }
  }

  return NextResponse.json({ received: true });
}
