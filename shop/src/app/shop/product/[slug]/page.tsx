"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { products, slugify } from "@/data/products";
import {
  ShoppingCart,
  Heart,
  Share2,
  ChevronRight,
  Upload,
  Star,
  Sparkles,
  Check,
  ImageIcon,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const product = products.find(
    (p) => slugify(p.name + "-" + p.billCode) === slug
  );
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Product Not Found</h1>
        <Link href="/shop">
          <Button variant="primary" className="mt-6">
            Back to Shop
          </Button>
        </Link>
      </div>
    );
  }

  const related = products
    .filter(
      (p) =>
        p.category === product.category &&
        p.billCode !== product.billCode
    )
    .slice(0, 4);

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/shop" className="hover:text-teal-600">
          Shop
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/shop?category=${product.category.toLowerCase().replace(/[^a-z]+/g, "-")}`}
          className="hover:text-teal-600"
        >
          {product.category}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-900 font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image Area */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-50 to-gray-50 aspect-square flex items-center justify-center">
          <div className="text-center p-8">
            <div className="mx-auto h-24 w-24 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm mb-6">
              <ImageIcon className="h-12 w-12 text-teal-600" />
            </div>
            <p className="text-gray-500 text-sm">
              Upload a photo to preview it on this product
            </p>
            <Link href="/gallery">
              <Button variant="outline" size="sm" className="mt-4">
                <Upload className="h-4 w-4 mr-2" />
                Choose from Gallery
              </Button>
            </Link>
          </div>

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.isBestSeller && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow">
                <Star className="h-3.5 w-3.5" /> Best Seller
              </span>
            )}
            {product.isNew && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow">
                <Sparkles className="h-3.5 w-3.5" /> New
              </span>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <p className="text-sm font-medium text-teal-600 mb-2">
            {product.category} &middot; {product.subCategory}
          </p>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          <p className="mt-4 text-4xl font-bold text-gray-900">
            {formatPrice(product.msrp)}
          </p>

          {product.description && (
            <p className="mt-4 text-gray-600 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Product details */}
          <div className="mt-6 space-y-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-teal-600" />
              Professional Fujifilm quality
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-teal-600" />
              Product Code: {product.productCode}
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-teal-600" />
              Ships within 3 business days
            </div>
          </div>

          {/* Quantity */}
          <div className="mt-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-10 w-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
              >
                −
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="h-10 w-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button
              variant="orange"
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
            >
              {addedToCart ? (
                <>
                  <Check className="h-5 w-5 mr-2" /> Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart
                </>
              )}
            </Button>
            <Button variant="outline" size="lg">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {related.map((p, i) => (
              <Link
                key={`${p.billCode}-${i}`}
                href={`/shop/product/${slugify(p.name + "-" + p.billCode)}`}
                className="group block"
              >
                <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-gray-50 aspect-square flex items-center justify-center group-hover:from-teal-100 transition-colors">
                  <ImageIcon className="h-10 w-10 text-teal-600/40" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-gray-900 group-hover:text-teal-700 line-clamp-2">
                  {p.name}
                </h3>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  {formatPrice(p.msrp)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
