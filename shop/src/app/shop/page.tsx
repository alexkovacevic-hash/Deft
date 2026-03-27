"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/ui/ProductCard";
import { Button } from "@/components/ui/Button";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { products, slugify } from "@/data/products";

const categoryFilters = [
  { label: "All Products", value: "" },
  { label: "Prints", value: "prints" },
  { label: "Wall Décor", value: "wall-decor" },
  { label: "Photo Books", value: "albums-books" },
  { label: "Cards", value: "cards" },
  { label: "Drinkware", value: "drinkware" },
  { label: "Home & Office", value: "home-office" },
  { label: "Puzzles", value: "puzzles" },
  { label: "Textiles", value: "textiles" },
  { label: "Ornaments", value: "ornaments" },
  { label: "Accessories", value: "accessories" },
  { label: "Calendars", value: "calendars" },
];

function categoryMatch(product: (typeof products)[0], filter: string): boolean {
  if (!filter) return true;
  const cat = product.category.toLowerCase();
  const sub = product.subCategory.toLowerCase();
  switch (filter) {
    case "prints":
      return cat.includes("format prints");
    case "wall-decor":
      return cat.includes("wall d") || cat.includes("wall decor");
    case "albums-books":
      return cat.includes("albums") || cat.includes("books");
    case "cards":
      return cat.includes("card") && !cat.includes("press print");
    case "drinkware":
      return cat.includes("drinkware");
    case "home-office":
      return cat.includes("home & office") || cat.includes("press print");
    case "puzzles":
      return cat.includes("puzzle");
    case "textiles":
      return cat.includes("textile");
    case "ornaments":
      return cat.includes("ornament");
    case "accessories":
      return cat.includes("accessor");
    case "calendars":
      return cat.includes("calendar");
    default:
      return true;
  }
}

const sortOptions = [
  { label: "Featured", value: "featured" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Name A–Z", value: "name-asc" },
];

export default function ShopPage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 24;

  const filtered = useMemo(() => {
    let result = products.filter((p) => categoryMatch(p, activeCategory));

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.subCategory.toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case "price-asc":
        result.sort((a, b) => a.msrp - b.msrp);
        break;
      case "price-desc":
        result.sort((a, b) => b.msrp - a.msrp);
        break;
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        result.sort((a, b) => {
          if (a.isBestSeller && !b.isBestSeller) return -1;
          if (!a.isBestSeller && b.isBestSeller) return 1;
          if (a.isNew && !b.isNew) return -1;
          if (!a.isNew && b.isNew) return 1;
          return 0;
        });
    }

    return result;
  }, [activeCategory, search, sort]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shop Products</h1>
        <p className="mt-2 text-gray-500">
          {filtered.length} products available
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Button
          variant="ghost"
          className="sm:hidden"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
        </Button>
      </div>

      {/* Category Chips */}
      <div
        className={`flex flex-wrap gap-2 mb-8 ${showFilters ? "" : "hidden sm:flex"}`}
      >
        {categoryFilters.map((cat) => (
          <button
            key={cat.value}
            onClick={() => {
              setActiveCategory(cat.value);
              setPage(1);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === cat.value
                ? "bg-teal-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {paginated.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {paginated.map((product, i) => (
            <ProductCard
              key={`${product.billCode}-${i}`}
              name={product.name}
              slug={slugify(product.name + "-" + product.billCode)}
              category={product.category}
              subCategory={product.subCategory}
              msrp={product.msrp}
              isBestSeller={product.isBestSeller}
              isNew={product.isNew}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-lg text-gray-500">No products found.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearch("");
              setActiveCategory("");
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = i + 1;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-9 w-9 rounded-full text-sm font-medium transition-colors ${
                  page === p
                    ? "bg-teal-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            );
          })}
          {totalPages > 7 && (
            <span className="text-gray-400">...</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
