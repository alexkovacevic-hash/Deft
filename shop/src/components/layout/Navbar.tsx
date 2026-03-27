"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  ImageIcon,
  ChevronDown,
} from "lucide-react";

const categories = [
  { name: "Prints", href: "/shop?category=prints" },
  { name: "Wall Décor", href: "/shop?category=wall-decor" },
  { name: "Photo Books", href: "/shop?category=albums-books" },
  { name: "Cards", href: "/shop?category=cards" },
  { name: "Drinkware", href: "/shop?category=drinkware" },
  { name: "Gifts", href: "/shop?category=home-office" },
  { name: "Blankets & Textiles", href: "/shop?category=textiles" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600">
              <ImageIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-teal-700">Photo</span>
              <span className="text-gray-900">Shop</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <div
              className="relative"
              onMouseEnter={() => setShopOpen(true)}
              onMouseLeave={() => setShopOpen(false)}
            >
              <Link
                href="/shop"
                className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-teal-600 transition-colors"
              >
                Shop <ChevronDown className="h-3.5 w-3.5" />
              </Link>
              {shopOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 rounded-xl bg-white p-2 shadow-xl ring-1 ring-gray-100">
                  {categories.map((cat) => (
                    <Link
                      key={cat.name}
                      href={cat.href}
                      className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link
              href="/gallery"
              className="text-sm font-medium text-gray-700 hover:text-teal-600 transition-colors"
            >
              My Gallery
            </Link>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-3">
            <Link
              href="/cart"
              className="relative rounded-full p-2 text-gray-600 hover:bg-gray-50 hover:text-teal-600 transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
            </Link>
            <Link
              href="/auth/signin"
              className="hidden md:flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
            >
              <User className="h-4 w-4" />
              Sign In
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden rounded-full p-2 text-gray-600 hover:bg-gray-50"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-1">
            <Link
              href="/shop"
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-teal-50"
              onClick={() => setMobileOpen(false)}
            >
              Shop All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-teal-50 pl-6"
                onClick={() => setMobileOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/gallery"
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-teal-50"
              onClick={() => setMobileOpen(false)}
            >
              My Gallery
            </Link>
            <Link
              href="/auth/signin"
              className="block rounded-lg bg-teal-600 px-3 py-2.5 text-center text-sm font-medium text-white mt-2"
              onClick={() => setMobileOpen(false)}
            >
              Sign In
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
