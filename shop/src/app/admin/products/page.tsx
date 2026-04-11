"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ImageIcon,
  Check,
  X,
  RotateCcw,
} from "lucide-react";
import { slugify } from "@/data/products";

interface AdminProduct {
  billCode: string;
  productCode: string;
  category: string;
  subCategory: string;
  name: string;
  msrp: number;
  originalMsrp: number;
  customImage: string | null;
  hasOverride: boolean;
  isBestSeller?: boolean;
  isNew?: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    params.set("page", page.toString());
    params.set("limit", "25");

    const res = await fetch(`/api/admin/products?${params}`);
    const data = await res.json();
    setProducts(data.items || []);
    setPagination(data.pagination || null);
    if (data.categories) setCategories(data.categories);
    setLoading(false);
  }, [search, category, page]);

  useEffect(() => {
    const timeout = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeout);
  }, [fetchProducts]);

  const startEditPrice = (product: AdminProduct) => {
    setEditingPrice(product.billCode);
    setEditValue(product.msrp.toFixed(2));
  };

  const savePrice = async (billCode: string) => {
    const msrp = parseFloat(editValue);
    if (isNaN(msrp) || msrp < 0) return;

    setSaving(billCode);
    await fetch(`/api/admin/products/${billCode}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ msrp }),
    });
    setEditingPrice(null);
    setSaving(null);
    fetchProducts();
  };

  const resetPrice = async (billCode: string) => {
    setSaving(billCode);
    await fetch(`/api/admin/products/${billCode}`, { method: "DELETE" });
    setSaving(null);
    fetchProducts();
  };

  const categorySlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z]+/g, "-");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="mt-1 text-sm text-gray-500">
          {pagination?.total ?? "..."} products in catalog
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, bill code, or product code..."
            className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 bg-white"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={categorySlug(cat)}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Product Table */}
      <div className="rounded-2xl bg-white ring-1 ring-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Product
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Category
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Bill Code
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">
                  MSRP
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3" colSpan={5}>
                        <div className="h-5 bg-gray-100 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                : products.map((product) => (
                    <tr
                      key={product.billCode}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                            {product.customImage ? (
                              <Image
                                src={product.customImage}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <Image
                                src={`/images/products/${slugify(product.name)}.jpg`}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate max-w-[200px]">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {product.subCategory}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {product.category}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        {product.billCode}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingPrice === product.billCode ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-gray-400">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  savePrice(product.billCode);
                                if (e.key === "Escape") setEditingPrice(null);
                              }}
                              className="w-20 rounded-lg border border-teal-300 px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                              autoFocus
                            />
                            <button
                              onClick={() => savePrice(product.billCode)}
                              disabled={saving === product.billCode}
                              className="p-1 rounded text-teal-600 hover:bg-teal-50"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingPrice(null)}
                              className="p-1 rounded text-gray-400 hover:bg-gray-100"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <span
                              className={`font-medium ${
                                product.hasOverride
                                  ? "text-orange-600"
                                  : "text-gray-900"
                              }`}
                            >
                              ${product.msrp.toFixed(2)}
                            </span>
                            {product.hasOverride && (
                              <span className="text-xs text-gray-400 line-through">
                                ${product.originalMsrp.toFixed(2)}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => startEditPrice(product)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                            title="Edit price"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <Link
                            href={`/admin/products/${product.billCode}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                            title="Edit product details & image"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Link>
                          {product.hasOverride && (
                            <button
                              onClick={() => resetPrice(product.billCode)}
                              disabled={saving === product.billCode}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Reset to original price"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}-
              {Math.min(
                pagination.page * pagination.limit,
                pagination.total
              )}{" "}
              of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPage(Math.min(pagination.totalPages, page + 1))
                }
                disabled={page === pagination.totalPages}
                className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
