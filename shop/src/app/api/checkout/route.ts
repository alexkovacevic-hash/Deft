import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { z } from "zod";

const checkoutSchema = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      msrp: z.number().positive(),
      quantity: z.number().int().positive(),
      imageFilename: z.string(),
    })
  ),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid cart data" },
        { status: 400 }
      );
    }

    const { items } = parsed.data;

    // Create Stripe Checkout Session using Stripe Connect
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            description: `Photo: ${item.imageFilename}`,
            metadata: {
              imageFilename: item.imageFilename,
            },
          },
          unit_amount: Math.round(item.msrp * 100), // Stripe uses cents
        },
        quantity: item.quantity,
      })),
      success_url: `${process.env.NEXTAUTH_URL}/cart?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/cart?canceled=true`,
      metadata: {
        source: "fuji-photo-shop",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
