import Link from "next/link";
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

  return (
    <Link
      href={`/shop?category=${slug}`}
      className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 hover:shadow-lg hover:ring-teal-200 transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">
            {name}
          </h3>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{description}</p>
          <p className="mt-2 text-xs font-medium text-teal-600">
            {productCount} products
          </p>
        </div>
      </div>
    </Link>
  );
}
