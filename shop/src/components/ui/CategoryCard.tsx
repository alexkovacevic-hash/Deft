import Link from "next/link";
import NextImage from "next/image";
import {
  Image,
  Frame,
  BookOpen,
  Coffee,
  Mail,
  Puzzle,
  Home,
  Gift,
  Shirt,
  Smartphone,
  Calendar,
  Snowflake,
} from "lucide-react";

const categoryIcons: Record<string, React.ElementType> = {
  prints: Image,
  "wall-decor": Frame,
  "albums-books": BookOpen,
  drinkware: Coffee,
  cards: Mail,
  puzzles: Puzzle,
  "home-office": Home,
  ornaments: Snowflake,
  textiles: Shirt,
  accessories: Smartphone,
  calendars: Calendar,
  gifts: Gift,
};

const categoryImages: Record<string, string> = {
  prints: "/images/products/prints-1.jpg",
  "wall-decor": "/images/products/wall-decor-acrylic-3.jpg",
  "albums-books": "/images/products/albums-books-1.jpg",
  drinkware: "/images/products/drinkware-1.jpg",
  cards: "/images/products/cards-1.jpg",
  puzzles: "/images/products/puzzles-1.jpg",
  "home-office": "/images/products/home-office-1.jpg",
  ornaments: "/images/products/ornaments-1.jpg",
  textiles: "/images/products/textiles-1.jpg",
  accessories: "/images/products/accessories-1.jpg",
  calendars: "/images/products/calendars-1.jpg",
};

interface CategoryCardProps {
  name: string;
  slug: string;
  productCount: number;
  description: string;
}

export function CategoryCard({
  name,
  slug,
  productCount,
  description,
}: CategoryCardProps) {
  const Icon = categoryIcons[slug] || Gift;
  const bgImage = categoryImages[slug];

  return (
    <Link
      href={`/shop?category=${slug}`}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 hover:shadow-lg hover:ring-teal-200 transition-all duration-300"
    >
      {/* Category image background */}
      {bgImage && (
        <div className="relative h-36 overflow-hidden">
          <NextImage
            src={bgImage}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent" />
        </div>
      )}

      <div className="p-5 pt-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300 -mt-8 relative ring-2 ring-white shadow-sm">
            <Icon className="h-5 w-5" />
          </div>
          <div className="-mt-1">
            <h3 className="font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">
              {name}
            </h3>
            <p className="mt-0.5 text-xs font-medium text-teal-600">
              {productCount} products
            </p>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-500 line-clamp-2">{description}</p>
      </div>
    </Link>
  );
}
