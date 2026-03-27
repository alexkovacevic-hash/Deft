"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { ShoppingCart, Star, Sparkles } from "lucide-react";

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
  return (
    <Link href={`/shop/product/${slug}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl bg-gray-50 aspect-square">
        {/* Placeholder image area */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-teal-50 to-gray-100 group-hover:from-teal-100 group-hover:to-gray-50 transition-colors duration-300">
          <div className="text-center p-4">
            <div className="mx-auto h-16 w-16 rounded-xl bg-white/80 flex items-center justify-center shadow-sm mb-3">
              <ShoppingCart className="h-7 w-7 text-teal-600" />
            </div>
            <p className="text-xs text-gray-500 font-medium">{subCategory}</p>
          </div>
        </div>

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
