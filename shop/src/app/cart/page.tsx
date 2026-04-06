"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  ImageIcon,
} from "lucide-react";

interface CartItem {
  id: string;
  billCode: string;
  name: string;
  category: string;
  subCategory: string;
  msrp: number;
  quantity: number;
  imageName: string;
  imageUrl: string;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {
        setItems([]);
      }
    }
    setLoaded(true);
  }, []);

  const saveCart = (newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem("cart", JSON.stringify(newItems));
    window.dispatchEvent(new Event("cart-updated"));
  };

  const updateQuantity = (id: string, delta: number) => {
    const updated = items
      .map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      )
      .filter((item) => item.quantity > 0);
    saveCart(updated);
  };

  const removeItem = (id: string) => {
    saveCart(items.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.msrp * item.quantity,
    0
  );
  const shipping = subtotal > 50 ? 0 : 7.99;
  const total = subtotal + shipping;

  if (!loaded) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gray-100 animate-pulse" />
        <div className="h-6 w-48 mx-auto bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-200 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">
          Your Cart is Empty
        </h1>
        <p className="mt-3 text-gray-500 max-w-sm mx-auto">
          Start by browsing our products and uploading a photo to create your
          personalized product.
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
              {/* User's selected photo thumbnail */}
              <div className="h-24 w-24 shrink-0 rounded-xl overflow-hidden bg-gray-100 relative">
                {item.imageUrl && !item.imageUrl.startsWith("blob:") ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.imageName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-teal-300 mb-1" />
                    <span className="text-[10px] text-gray-400 text-center px-1 leading-tight">
                      {item.imageName}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-teal-600 font-medium">
                  {item.category}
                </p>
                <h3 className="text-sm font-semibold text-gray-900 mt-0.5">
                  {item.name}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  {item.imageName}
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
