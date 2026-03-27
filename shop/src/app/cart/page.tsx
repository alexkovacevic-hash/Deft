"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  ImageIcon,
  CreditCard,
} from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  category: string;
  msrp: number;
  quantity: number;
  imageFilename: string;
}

// Demo cart items
const initialItems: CartItem[] = [
  {
    id: "1",
    name: "11x14 Gallery-Wrapped Canvas",
    category: "Wall Décor",
    msrp: 58.99,
    quantity: 1,
    imageFilename: "family-portrait.jpg",
  },
  {
    id: "2",
    name: "Print 8x10",
    category: "Small Format Prints",
    msrp: 3.99,
    quantity: 3,
    imageFilename: "beach-sunset.jpg",
  },
  {
    id: "3",
    name: "White Ceramic Mug 15 oz.",
    category: "Drinkware",
    msrp: 16.99,
    quantity: 2,
    imageFilename: "holiday-gathering.jpg",
  },
];

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(initialItems);

  const updateQuantity = (id: string, delta: number) => {
    setItems(
      items
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.msrp * item.quantity,
    0
  );
  const shipping = subtotal > 50 ? 0 : 7.99;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-200 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">
          Your Cart is Empty
        </h1>
        <p className="mt-3 text-gray-500 max-w-sm mx-auto">
          Start by browsing our products or uploading photos to your gallery.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/shop">
            <Button variant="primary" size="lg">
              Browse Products
            </Button>
          </Link>
          <Link href="/gallery">
            <Button variant="outline" size="lg">
              Upload Photos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-gray-100"
            >
              {/* Image placeholder */}
              <div className="h-24 w-24 shrink-0 rounded-xl bg-gradient-to-br from-teal-50 to-gray-100 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-teal-300" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-teal-600 font-medium">
                  {item.category}
                </p>
                <h3 className="text-sm font-semibold text-gray-900 mt-0.5">
                  {item.name}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Photo: {item.imageFilename}
                </p>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-2 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {formatPrice(item.msrp * item.quantity)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl bg-gray-50 p-6 ring-1 ring-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)
                </span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">
                  {shipping === 0 ? (
                    <span className="text-teal-600">Free</span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-teal-600">
                  Add {formatPrice(50 - subtotal)} more for free shipping!
                </p>
              )}
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-lg text-gray-900">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            <Button
              variant="orange"
              size="lg"
              className="w-full mt-6"
              onClick={() => {
                // In production: redirect to Stripe Checkout
                alert("This would redirect to Stripe Checkout");
              }}
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Checkout with Stripe
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              Secure checkout powered by Stripe
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
