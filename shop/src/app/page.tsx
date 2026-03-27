import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CategoryCard } from "@/components/ui/CategoryCard";
import {
  Camera,
  Upload,
  ShoppingBag,
  Truck,
  Shield,
  Star,
  ArrowRight,
} from "lucide-react";

const featuredCategories = [
  {
    name: "Prints & Posters",
    slug: "prints",
    productCount: 56,
    description: "Silver halide and inkjet prints in sizes from wallet to 32x48.",
  },
  {
    name: "Wall Décor",
    slug: "wall-decor",
    productCount: 120,
    description: "Acrylic, metal, canvas, mounted, and framed prints for your walls.",
  },
  {
    name: "Photo Books",
    slug: "albums-books",
    productCount: 32,
    description: "Softcover, hardcover, and layflat books to preserve your memories.",
  },
  {
    name: "Drinkware",
    slug: "drinkware",
    productCount: 30,
    description: "Ceramic mugs, tumblers, water bottles, and more.",
  },
  {
    name: "Cards & Stationery",
    slug: "cards",
    productCount: 55,
    description: "Photo cards, foil cards, postcards, and folded note cards.",
  },
  {
    name: "Home & Office",
    slug: "home-office",
    productCount: 65,
    description: "Desk prints, plaques, coasters, magnets, notebooks, and more.",
  },
  {
    name: "Puzzles",
    slug: "puzzles",
    productCount: 7,
    description: "Custom photo puzzles for the whole family, including kids sizes.",
  },
  {
    name: "Textiles",
    slug: "textiles",
    productCount: 18,
    description: "Fleece blankets, sherpa throws, pillows, tote bags, and t-shirts.",
  },
  {
    name: "Ornaments",
    slug: "ornaments",
    productCount: 22,
    description: "Acrylic, metal, ceramic, glass, and premium ornaments.",
  },
  {
    name: "Calendars",
    slug: "calendars",
    productCount: 7,
    description: "Desktop, wall, and keepsake photo calendars.",
  },
  {
    name: "Accessories",
    slug: "accessories",
    productCount: 35,
    description: "iPhone cases, keychains, and wireless chargers.",
  },
];

const howItWorks = [
  {
    icon: Camera,
    title: "Choose Your Photos",
    description:
      "Browse your pre-loaded gallery or upload new images directly from your device.",
  },
  {
    icon: ShoppingBag,
    title: "Pick Your Products",
    description:
      "Select from 450+ professional photo products powered by Fujifilm.",
  },
  {
    icon: Upload,
    title: "Customize & Order",
    description:
      "Preview your photo on each product and place your order securely with Stripe.",
  },
  {
    icon: Truck,
    title: "Delivered to You",
    description:
      "Your professionally printed products ship directly to your door.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-600 to-teal-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0di0xaC0ydjFoLTJ2Mmgydi0xaDJ2LTFoLTJ6bTAtNHYtMWgtMnYxaC0ydjJoMnYtMWgydi0xaC0yem0tNCA0di0xaC0ydjFoLTJ2Mmgydi0xaDJ2LTFoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
              Turn Your Photos Into{" "}
              <span className="text-teal-200">Beautiful Products</span>
            </h1>
            <p className="mt-6 text-lg text-teal-100 leading-relaxed max-w-xl">
              Choose from over 450 professionally printed photo products — from
              prints and wall art to photo books, mugs, blankets, and more.
              Powered by Fujifilm quality.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/shop">
                <Button variant="orange" size="lg" className="w-full sm:w-auto">
                  Start Shopping
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/gallery">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 hover:text-white"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Photos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-b border-gray-100 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Star, label: "Fujifilm Quality" },
              { icon: Shield, label: "Secure Checkout" },
              { icon: Truck, label: "Fast Shipping" },
              { icon: Camera, label: "450+ Products" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center justify-center gap-2 text-gray-600"
              >
                <Icon className="h-5 w-5 text-teal-600" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-3 text-gray-500 max-w-lg mx-auto">
              From your phone to your doorstep in four simple steps.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-5">
                  <step.icon className="h-7 w-7" />
                </div>
                <div className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">
                  Step {i + 1}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Shop by Category
            </h2>
            <p className="mt-3 text-gray-500">
              Explore our full range of Fujifilm photo products.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredCategories.map((cat) => (
              <CategoryCard key={cat.slug} {...cat} />
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/shop">
              <Button variant="primary" size="lg">
                View All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 to-teal-700 px-8 py-16 sm:px-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to Print Your Memories?
            </h2>
            <p className="mt-4 text-teal-100 max-w-lg mx-auto text-lg">
              Create an account, upload your photos, and start creating
              beautiful products today.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button variant="orange" size="lg">
                  Create Free Account
                </Button>
              </Link>
              <Link href="/gallery">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 hover:text-white"
                >
                  Upload Photos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
