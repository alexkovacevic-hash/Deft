"use client";

import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { Star, Sparkles } from "lucide-react";
import { getProductImageUrl } from "@/data/products";

interface ProductCardProps {
  name: string;
  slug: string;
  category: string;
  subCategory: string;
  msrp: number;
  isBestSeller?: boolean;
  isNew?: boolean;
}

export function ProductCard({
  name,
  slug,
  category,
  subCategory,
  msrp,
  isBestSeller,
  isNew,
}: ProductCardProps) {
  const imageUrl = getProductImageUrl(name);

  return (
    <Link href={`/shop/product/${slug}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl bg-gray-50 aspect-square">
        {/* Product Image */}
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {isBestSeller && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              <Star className="h-3 w-3" /> Best Seller
            </span>
          )}
          {isNew && (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              <Sparkles className="h-3 w-3" /> New
            </span>
          )}
        </div>

        {/* Quick action overlay */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="bg-teal-600 text-white text-center py-2.5 text-sm font-medium">
            View Product
          </div>
        </div>
      </div>

      <div className="mt-3 px-1">
        <p className="text-xs text-teal-600 font-medium">{category}</p>
        <h3 className="text-sm font-semibold text-gray-900 mt-0.5 line-clamp-2 group-hover:text-teal-700 transition-colors">
          {name}
        </h3>
        <p className="text-base font-bold text-gray-900 mt-1.5">
          {formatPrice(msrp)}
        </p>
      </div>
    </Link>
  );
}
