import { NextRequest, NextResponse } from "next/server";
import { products } from "@/data/products";
import { readOverrides } from "@/lib/product-overrides";

export async function GET(request: NextRequest) {
  const overrides = readOverrides();
  const searchParams = request.nextUrl.searchParams;
  const billCode = searchParams.get("billCode");

  // If specific billCode requested
  if (billCode) {
    const product = products.find((p) => p.billCode === billCode);
    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const override = overrides[billCode];
    return NextResponse.json({
      ...product,
      msrp: override?.msrp ?? product.msrp,
      customImage: override?.customImage || null,
    });
  }

  // Return all products with overrides applied
  const items = products.map((p) => {
    const override = overrides[p.billCode];
    return {
      ...p,
      msrp: override?.msrp ?? p.msrp,
      customImage: override?.customImage || null,
    };
  });

  return NextResponse.json({ items });
}
