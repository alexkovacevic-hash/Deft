"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { products, slugify, getProductImageUrl } from "@/data/products";
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
  X,
  AlertCircle,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const product = products.find(
    (p) => slugify(p.name + "-" + p.billCode) === slug
  );
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [showImageRequired, setShowImageRequired] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const productImageUrl = getProductImageUrl(product.name);

  const related = products
    .filter(
      (p) =>
        p.category === product.category && p.billCode !== product.billCode
    )
    .slice(0, 4);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPEG, PNG, etc.)");
      return;
    }

    const url = URL.createObjectURL(file);
    setSelectedImage({ url, name: file.name });
    setShowImageRequired(false);
  };

  const clearSelectedImage = () => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage.url);
    }
    setSelectedImage(null);
  };

  const handleAddToCart = () => {
    if (!selectedImage) {
      setShowImageRequired(true);
      return;
    }

    setShowImageRequired(false);
    setAddedToCart(true);

    // Store in localStorage cart
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    cart.push({
      id: `${product.billCode}-${Date.now()}`,
      billCode: product.billCode,
      name: product.name,
      category: product.category,
      subCategory: product.subCategory,
      msrp: product.msrp,
      quantity,
      imageName: selectedImage.name,
      imageUrl: selectedImage.url,
    });
    localStorage.setItem("cart", JSON.stringify(cart));

    // Dispatch event so cart badge can update
    window.dispatchEvent(new Event("cart-updated"));

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
        <span className="text-gray-900 font-medium truncate">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image Area */}
        <div className="space-y-4">
          {/* Main product image */}
          <div className="relative overflow-hidden rounded-3xl bg-gray-50 aspect-square">
            <Image
              src={productImageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />

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

          {/* Selected photo preview (shown when user has picked a photo) */}
          {selectedImage && (
            <div className="relative rounded-2xl overflow-hidden ring-2 ring-teal-500 bg-gray-50">
              <div className="flex items-center gap-3 p-3">
                <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden">
                  <Image
                    src={selectedImage.url}
                    alt="Your selected photo"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-teal-600">
                    Your Photo
                  </p>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {selectedImage.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Ready to print on this product
                  </p>
                </div>
                <button
                  onClick={clearSelectedImage}
                  className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
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

          {/* Step 1: Select Your Photo */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  selectedImage
                    ? "bg-teal-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {selectedImage ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  "1"
                )}
              </div>
              <label className="text-sm font-semibold text-gray-900">
                Select Your Photo{" "}
                <span className="text-red-500 text-xs font-normal">
                  (required)
                </span>
              </label>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {!selectedImage ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                  showImageRequired
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 hover:border-teal-400 hover:bg-teal-50/50"
                }`}
              >
                <ImageIcon
                  className={`h-10 w-10 mx-auto mb-3 ${
                    showImageRequired ? "text-red-400" : "text-gray-300"
                  }`}
                />
                <p className="text-sm font-medium text-gray-700">
                  Click to upload a photo
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPEG, PNG up to 25MB
                </p>

                {showImageRequired && (
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      Please select a photo before adding to cart
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                Change photo
              </button>
            )}
          </div>

          {/* Step 2: Quantity */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                2
              </div>
              <label className="text-sm font-semibold text-gray-900">
                Quantity
              </label>
            </div>
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
              variant={selectedImage ? "orange" : "primary"}
              size="lg"
              className={`flex-1 ${!selectedImage ? "opacity-75" : ""}`}
              onClick={handleAddToCart}
            >
              {addedToCart ? (
                <>
                  <Check className="h-5 w-5 mr-2" /> Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {selectedImage ? "Add to Cart" : "Select a Photo First"}
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

          {!selectedImage && (
            <p className="mt-3 text-xs text-gray-500 flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              Upload or select a photo to see it on this product and add to cart
            </p>
          )}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {related.map((p, i) => {
              const relatedImage = getProductImageUrl(p.name);
              return (
                <Link
                  key={`${p.billCode}-${i}`}
                  href={`/shop/product/${slugify(p.name + "-" + p.billCode)}`}
                  className="group block"
                >
                  <div className="relative rounded-2xl bg-gray-50 aspect-square overflow-hidden">
                    <Image
                      src={relatedImage}
                      alt={p.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-gray-900 group-hover:text-teal-700 line-clamp-2">
                    {p.name}
                  </h3>
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {formatPrice(p.msrp)}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
