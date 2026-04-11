"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Save,
  RotateCcw,
  Check,
  ImageIcon,
  DollarSign,
  Tag,
  Layers,
} from "lucide-react";
import { slugify } from "@/data/products";

interface ProductDetail {
  billCode: string;
  productCode: string;
  category: string;
  subCategory: string;
  name: string;
  msrp: number;
  originalMsrp: number;
  netPrice?: number;
  orderFee?: number;
  customImage: string | null;
  hasOverride: boolean;
  isBestSeller?: boolean;
  isNew?: boolean;
  description?: string;
}

export default function AdminProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const billCode = params.billCode as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imageUploaded, setImageUploaded] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/products/${billCode}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setProduct(data);
        setPrice(data.msrp.toFixed(2));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [billCode]);

  const handleSavePrice = async () => {
    const msrp = parseFloat(price);
    if (isNaN(msrp) || msrp < 0) return;

    setSaving(true);
    const res = await fetch(`/api/admin/products/${billCode}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ msrp }),
    });
    const updated = await res.json();
    setProduct(updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetPrice = async () => {
    setSaving(true);
    await fetch(`/api/admin/products/${billCode}`, { method: "DELETE" });
    const res = await fetch(`/api/admin/products/${billCode}`);
    const updated = await res.json();
    setProduct(updated);
    setPrice(updated.msrp.toFixed(2));
    setSaving(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`/api/admin/products/${billCode}/image`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      setProduct((prev) =>
        prev ? { ...prev, customImage: data.imagePath, hasOverride: true } : null
      );
      setImageUploaded(true);
      setTimeout(() => setImageUploaded(false), 2000);
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-gray-900">Product Not Found</h2>
        <Link
          href="/admin/products"
          className="mt-4 inline-flex items-center gap-2 text-teal-600 hover:text-teal-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>
      </div>
    );
  }

  const defaultImage = `/images/products/${slugify(product.name)}.jpg`;
  const displayImage = product.customImage || defaultImage;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-600 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {product.category} &middot; {product.subCategory} &middot; Bill Code:{" "}
          {product.billCode}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-teal-600" />
            Product Image
          </h2>

          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-4">
            <Image
              src={displayImage}
              alt={product.name}
              fill
              className="object-cover"
            />
            {product.customImage && (
              <div className="absolute top-3 right-3 rounded-full bg-orange-500 px-2.5 py-1 text-xs font-medium text-white">
                Custom Image
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {uploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Uploading...
                </>
              ) : imageUploaded ? (
                <>
                  <Check className="h-4 w-4" /> Image Updated!
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> Upload New Image
                </>
              )}
            </button>
          </div>

          <p className="mt-3 text-xs text-gray-400">
            Upload a JPEG or PNG image. This will replace the current product
            display image in the shop.
          </p>
        </div>

        {/* Price & Details Section */}
        <div className="space-y-6">
          {/* Price Editor */}
          <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-teal-600" />
              Pricing
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  MSRP (Customer Price)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 pl-8 pr-4 py-3 text-lg font-medium focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              {product.hasOverride && (
                <p className="text-sm text-orange-600 flex items-center gap-1.5">
                  <Tag className="h-4 w-4" />
                  Original catalog price: ${product.originalMsrp.toFixed(2)}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSavePrice}
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  {saved ? (
                    <>
                      <Check className="h-4 w-4" /> Saved!
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save Price
                    </>
                  )}
                </button>
                {product.hasOverride && (
                  <button
                    onClick={handleResetPrice}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" /> Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Product Info (read-only) */}
          <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-teal-600" />
              Product Details
            </h2>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Bill Code</dt>
                <dd className="font-mono text-gray-900">{product.billCode}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Product Code</dt>
                <dd className="font-mono text-gray-900">
                  {product.productCode}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Category</dt>
                <dd className="text-gray-900">{product.category}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Sub-Category</dt>
                <dd className="text-gray-900">{product.subCategory}</dd>
              </div>
              {product.netPrice !== undefined && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Net Price</dt>
                  <dd className="text-gray-900">
                    ${product.netPrice.toFixed(2)}
                  </dd>
                </div>
              )}
              {product.orderFee !== undefined && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Order Fee</dt>
                  <dd className="text-gray-900">
                    ${product.orderFee.toFixed(2)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">Best Seller</dt>
                <dd className="text-gray-900">
                  {product.isBestSeller ? "Yes" : "No"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">New Product</dt>
                <dd className="text-gray-900">
                  {product.isNew ? "Yes" : "No"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
