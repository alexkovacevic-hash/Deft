import { NextRequest, NextResponse } from "next/server";
import { getAdminTokenFromRequest, isValidSession } from "@/lib/admin-auth";
import { products } from "@/data/products";
import { readOverrides } from "@/lib/product-overrides";

export async function GET(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token || !isValidSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const overrides = readOverrides();
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search")?.toLowerCase() || "";
  const category = searchParams.get("category") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  let filtered = products.map((p) => {
    const override = overrides[p.billCode];
    return {
      ...p,
      msrp: override?.msrp ?? p.msrp,
      originalMsrp: p.msrp,
      customImage: override?.customImage || null,
      hasOverride: !!override,
    };
  });

  if (search) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.billCode.toLowerCase().includes(search) ||
        p.productCode.toLowerCase().includes(search)
    );
  }

  if (category) {
    filtered = filtered.filter(
      (p) => p.category.toLowerCase().replace(/[^a-z]+/g, "-") === category
    );
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  // Get unique categories for filter
  const categories = [...new Set(products.map((p) => p.category))].sort();

  return NextResponse.json({
    items,
    pagination: { page, limit, total, totalPages },
    categories,
  });
}
