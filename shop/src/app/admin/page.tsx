"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, DollarSign, Layers, Edit3 } from "lucide-react";

interface Stats {
  totalProducts: number;
  totalCategories: number;
  overriddenProducts: number;
  avgPrice: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/products?limit=999")
      .then((r) => r.json())
      .then((data) => {
        const items = data.items || [];
        const overridden = items.filter(
          (i: { hasOverride: boolean }) => i.hasOverride
        ).length;
        const categories = new Set(
          items.map((i: { category: string }) => i.category)
        );
        const avg =
          items.length > 0
            ? items.reduce(
                (s: number, i: { msrp: number }) => s + i.msrp,
                0
              ) / items.length
            : 0;

        setStats({
          totalProducts: data.pagination?.total || items.length,
          totalCategories: categories.size,
          overriddenProducts: overridden,
          avgPrice: avg,
        });
      });
  }, []);

  const statCards = stats
    ? [
        {
          label: "Total Products",
          value: stats.totalProducts.toString(),
          icon: Package,
          color: "bg-teal-50 text-teal-600",
        },
        {
          label: "Categories",
          value: stats.totalCategories.toString(),
          icon: Layers,
          color: "bg-blue-50 text-blue-600",
        },
        {
          label: "Price Overrides",
          value: stats.overriddenProducts.toString(),
          icon: Edit3,
          color: "bg-orange-50 text-orange-600",
        },
        {
          label: "Avg. Price",
          value: `$${stats.avgPrice.toFixed(2)}`,
          icon: DollarSign,
          color: "bg-green-50 text-green-600",
        },
      ]
    : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your product catalog, prices, and display images.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats
          ? statCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl bg-white p-5 ring-1 ring-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}
                  >
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {card.value}
                    </p>
                  </div>
                </div>
              </div>
            ))
          : Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white p-5 ring-1 ring-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gray-100 animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                    <div className="h-5 w-12 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/admin/products"
            className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Manage Products
              </p>
              <p className="text-xs text-gray-500">
                Edit prices and product images
              </p>
            </div>
          </Link>
          <Link
            href="/shop"
            className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">View Shop</p>
              <p className="text-xs text-gray-500">
                See your storefront as customers do
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
