import { NextRequest, NextResponse } from "next/server";
import { getAdminTokenFromRequest, isValidSession } from "@/lib/admin-auth";
import { products, slugify } from "@/data/products";
import { setOverride } from "@/lib/product-overrides";
import fs from "fs";
import path from "path";

export async function POST(
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

  const formData = await request.formData();
  const file = formData.get("image") as File | null;

  if (!file || !file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Please upload a valid image file" },
      { status: 400 }
    );
  }

  // Save to public/images/products/ with product slug name
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${slugify(product.name)}-custom.${ext}`;
  const imagePath = `/images/products/${filename}`;
  const absolutePath = path.join(process.cwd(), "public", "images", "products", filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(absolutePath, buffer);

  // Save override
  setOverride(billCode, { customImage: imagePath });

  return NextResponse.json({
    success: true,
    imagePath,
  });
}
