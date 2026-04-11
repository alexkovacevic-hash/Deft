import { NextRequest, NextResponse } from "next/server";
import { getAdminTokenFromRequest, isValidSession } from "@/lib/admin-auth";
import { products } from "@/data/products";
import { getOverride, setOverride, removeOverride } from "@/lib/product-overrides";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ billCode: string }> }
) {
  const token = getAdminTokenFromRequest(request);
  if (!token || !isValidSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { billCode } = await params;
  const product = products.find((p) => p.billCode === billCode);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const override = getOverride(billCode);
  return NextResponse.json({
    ...product,
    msrp: override?.msrp ?? product.msrp,
    originalMsrp: product.msrp,
    customImage: override?.customImage || null,
    hasOverride: !!override,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ billCode: string }> }
) {
  const token = getAdminTokenFromRequest(request);
  if (!token || !isValidSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { billCode } = await params;
  const product = products.find((p) => p.billCode === billCode);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const body = await request.json();
  const updates: Record<string, number | string> = {};

  if (body.msrp !== undefined) {
    const msrp = parseFloat(body.msrp);
    if (isNaN(msrp) || msrp < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }
    updates.msrp = msrp;
  }

  if (Object.keys(updates).length > 0) {
    setOverride(billCode, updates);
  }

  const override = getOverride(billCode);
  return NextResponse.json({
    ...product,
    msrp: override?.msrp ?? product.msrp,
    originalMsrp: product.msrp,
    customImage: override?.customImage || null,
    hasOverride: !!override,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ billCode: string }> }
) {
  const token = getAdminTokenFromRequest(request);
  if (!token || !isValidSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { billCode } = await params;
  removeOverride(billCode);
  return NextResponse.json({ success: true });
}
